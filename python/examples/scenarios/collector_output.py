import math
import time
import shutil
import yaml
import numpy as np
from pathlib import Path

from google.protobuf.json_format import MessageToDict
from protobuf_APIs import falconeye_pb2

from scenarios.utils.com_manager import ComManager, MqttConst
from scenarios.utils.filesystem import establish_fresh_directory
from scenarios.utils.gps import transform_combine_to_local
from scenarios.utils.image import postprocess, show_image
from scenarios.utils.read_protobufs import deserialize_collector_output,\
                                            extract_collector_output, extract_collector_output_slim

from scenarios.safety_subsystems.radar_filter import RadarFilter
from scenarios.safety_subsystems.path_prediction import PathPrediction

import xviz
import xviz.builder as xbuilder

cab_to_nose = 3.2131

DEG_1_AS_RAD = math.pi / 180
DEG_90_AS_RAD = 90 * DEG_1_AS_RAD


class CollectorScenario:

    def __init__(self, live=True, radius=30, duration=10, speed=10):
        self._timestamp = time.time()
        self._radius = radius
        self._duration = duration
        self._speed = speed
        self._live = live
        self._metadata = None
        self.index = 0
        self.data = []
        self.track_history = {}

        configfile = Path(__file__).parent / 'collector-scenario-config.yaml'
        collector_config = self.load_config(str(configfile))

        collector_output_file = collector_config['collector_output_file']
        extract_directory = collector_config['extract_directory']
        collector_output_file = Path(collector_output_file)
        print("Using:collector_output_file:", collector_output_file)
        extract_directory = Path(extract_directory)
        print("Using:extract_directory:", extract_directory)
        if not collector_output_file.is_file():
            print('collector output file does not exit')
        
        establish_fresh_directory(extract_directory)
        shutil.unpack_archive(str(collector_output_file), str(extract_directory))
        self.collector_outputs = sorted(extract_directory.glob('*.txt'))

        self.mqtt_enabled = collector_config['mqtt_enabled']
        if self.mqtt_enabled:
            self.mqtt_tracking_outputs = []
            comm = ComManager()
            comm.subscribe(MqttConst.TRACKS_TOPIC, self.store_tracking_output)
        
        configfile = Path(__file__).parents[3] / 'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
        global_config = self.load_config(str(configfile))
        radar_safety_config = global_config['safety']['radar']
        self.combine_length = radar_safety_config['combine_length']
        self.distance_threshold = radar_safety_config['distance_threshold']
        self.slowdown_threshold = radar_safety_config['slowdown_threshold']

        pfilter_enabled = True
        qfilter_enabled = radar_safety_config['enable_queue_filter']
        queue_size = 12
        consecutive_min = radar_safety_config['consecutive_detections']
        phi_sdv_max = radar_safety_config['phi_sdv_threshold']
        nan_threshold = radar_safety_config['qf_none_ratio_threshold']

        pf_pexist_min = radar_safety_config['confidence_threshold']
        qf_pexist_min = radar_safety_config['qf_confidence_threshold']

        pf_dbpower_min = radar_safety_config['d_bpower_threshold']
        qf_dbpower_min = radar_safety_config['qf_d_bpower_threshold']

        self.radar_filter = RadarFilter(pfilter_enabled, qfilter_enabled, queue_size,
                                        consecutive_min, pf_pexist_min, qf_pexist_min,
                                        pf_dbpower_min, qf_dbpower_min, phi_sdv_max, nan_threshold)

        self.wheel_base = global_config['guidance']['wheel_base']
        prediction_args = {
            'wheel_base': self.wheel_base,
            'machine_width': global_config['navigation']['machine_width']
        }
        self.path_prediction = PathPrediction(prediction_args)

        self.tractor_state = None
        self.combine_states = {}
        self.planned_path = None
        self.field_definition = None


    def load_config(self, configfile):
        with open(configfile, 'r') as f:
            config = yaml.safe_load(f)

        return config

    
    def reset_values(self):
        self.tractor_state = None
        self.combine_states = {}
        self.planned_path = None
        self.field_definition = None

    
    def store_tracking_output(self, msg):
        tracking_output = falconeye_pb2.TrackingOutput()
        tracking_output.ParseFromString(msg.payload)
        tracking_output = MessageToDict(tracking_output, including_default_value_fields=True)
        self.mqtt_tracking_outputs.append(tracking_output)
        print('tracking outputs received:', len(self.mqtt_tracking_outputs))


    def get_metadata(self):
        if not self._metadata:
            builder = xviz.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz.CATEGORY.POSE)
            builder.stream("/tractor_heading")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/radar_filtered_out_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/radar_passed_filter_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/radar_crucial_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

            builder.stream("/tracking_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/camera_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
                
            builder.stream("/combine_position")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/combine_heading")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            builder.stream("/combine_region")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({
                    'stroked': True,
                    'filled': False,
                    'stroke_width': 0.3,
                    'stroke_color': [0, 20, 128, 50],
                })\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            
            builder.stream("/field_definition")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [165, 42, 42, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/predicted_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [0, 128, 128, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            builder.stream("/planned_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [128, 0, 128, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/radar_fov")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [255, 0, 0, 100]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            builder.stream("/camera_fov")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [0, 150, 200, 100]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/measuring_circles")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({
                    'stroked': True,
                    'filled': False,
                    'stroke_width': 0.2,
                    'stroke_color': [0, 0, 0, 20],
                })\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

            builder.stream("/measuring_circles_lbl")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({
                    'fill_color': [0, 0, 0]
                })\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.TEXT)

            builder.stream("/tracking_id")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({
                    'fill_color': [0, 0, 0]
                })\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.TEXT)

            self._metadata = builder.get_message()

        metadata = {
            'type': 'xviz/metadata',
            'data': self._metadata.to_object()
        }

        if not self._live:
            log_start_time = self._timestamp
            metadata['data']['log_info'] = {
                "log_start_time": log_start_time,
                "log_end_time": log_start_time + self._duration
            }

        return metadata


    def get_message(self, time_offset):
        try:
            timestamp = self._timestamp + time_offset

            builder = xviz.XVIZBuilder(metadata=self._metadata)
            self._draw_measuring_references(builder, timestamp)
            self._draw_collector_output(builder, timestamp)
            data = builder.get_message()

            return {
                'type': 'xviz/state_update',
                'data': data.to_object()
            }
        except Exception as e:
            print("Crashed in get_message:", e)


    def _draw_measuring_references(self, builder: xviz.XVIZBuilder, timestamp):
        radial_distances = set([5, 10, 15, 20, 25, 30])
        radial_distances.add(self.slowdown_threshold)
        radial_distances.add(self.distance_threshold)
        radial_distances = sorted(radial_distances, reverse=True)

        for r in radial_distances:
            builder.primitive('/measuring_circles_lbl')\
                .text(str(r))\
                .position([r+cab_to_nose, 0, .1])\
                .id(f'{r}lb')

            if r == self.slowdown_threshold:
                builder.primitive('/measuring_circles')\
                    .circle([cab_to_nose, 0, 0], r)\
                    .style({'stroke_color': [255, 200, 0, 70]})\
                    .id('slowdown: ' + str(r))
            elif r == self.distance_threshold:
                builder.primitive('/measuring_circles')\
                    .circle([cab_to_nose, 0, 0], r)\
                    .style({'stroke_color': [255, 50, 10, 70]})\
                    .id('stop: ' + str(r))
            else:
                builder.primitive('/measuring_circles')\
                    .circle([cab_to_nose, 0, 0], r)\
                    .id(str(r))

        cam_fov = [-28.5, 28.5] # 57 deg
        radar_fov = [-27, -13.5, -6.75, 0, 6.75, 13.5, 27] # 54 degrees

        for c_phi in cam_fov:
            r = 40
            label = (r, c_phi)
            (x, y, z) = get_object_xyz_primitive(r+cab_to_nose, c_phi*math.pi/180)
            vertices = [cab_to_nose, 0, 0, x, y, z]
            builder.primitive('/camera_fov')\
                .polyline(vertices)\
                .id("cam_fov: "+str(label))

        for r_phi in radar_fov:
            r = 40
            (x, y, z) = get_object_xyz_primitive(r+cab_to_nose, r_phi*math.pi/180)
            builder.primitive('/measuring_circles_lbl')\
                .text(str(r_phi))\
                .position([x, y, z])\
                .id(str(r_phi)+'lb')
            if r_phi == radar_fov[0] or r_phi == radar_fov[-1]:
                label = (r, r_phi)
                vertices = [cab_to_nose, 0, 0, x, y, z]
                builder.primitive('/radar_fov')\
                    .polyline(vertices)\
                    .id("radar_fov: "+str(label))


    def _draw_collector_output(self, builder: xviz.XVIZBuilder, timestamp):
        try:
            builder.pose()\
                .timestamp(timestamp)

            if self.index == len(self.collector_outputs):
                self.reset_values()
                self.index = 0

            collector_output = self.collector_outputs[self.index]

            collector_output, is_slim_output = deserialize_collector_output(collector_output)
            if is_slim_output:
                img, camera_output, radar_output, tracking_output,\
                    machine_state, field_definition, planned_path = extract_collector_output_slim(collector_output)
            else:
                img, camera_output, radar_output,\
                    tracking_output, machine_state = extract_collector_output(collector_output)
                field_definition = None
                planned_path = None

            if camera_output is not None:
                self._draw_camera_targets(camera_output, builder)

            if radar_output is not None:
                self._draw_radar_targets(radar_output, builder)

            if self.mqtt_enabled:
                if self.mqtt_tracking_outputs:
                    tracking_output = self.mqtt_tracking_outputs[self.index]
                else:
                    print("mqtt enabled but no mqtt tracking outputs are stored")
                    tracking_output = None
            if tracking_output is not None:
                self._draw_tracking_targets(tracking_output, builder)

            if machine_state is not None:
                self._draw_machine_state(machine_state, builder)
                self._draw_predicted_path(machine_state, builder)

            if field_definition is not None:
                self._draw_field_definition(field_definition, builder)
            elif self.field_definition is not None:
                self._draw_field_definition(self.field_definition, builder)

            if planned_path is not None:
                self._draw_planned_path(planned_path, builder)
            elif self.planned_path is not None:
                self._draw_planned_path(self.planned_path, builder)

            if img is not None:
                if camera_output is not None:
                    img = postprocess(img, camera_output)
                show_image(img)

            # if self.index == 0:
            #     print('start time:', time.gmtime(float(collector_output.timestamp)))
            # elif self.index == len(self.collector_outputs) - 1:
            #     print('end time:', time.gmtime(float(collector_output.timestamp)))

            self.index += 1

        except Exception as e:
            print('Crashed in draw collector output:', e)


    def _draw_radar_targets(self, radar_output, builder: xviz.XVIZBuilder):
        try:
            for target in radar_output['targets'].values():
                if abs(target['dr']) < 0.1 and abs(target['phi']) < 0.01:
                    continue
                to_path_prediction = False
                (x, y, z) = get_object_xyz(target, 'phi', 'dr', radar_ob=True)
    
                if self.radar_filter.is_valid_target(target['targetId'], target):
                    if self.radar_filter.filter_targets_until_path_prediction(target):
                        to_path_prediction = True
                 
                    fill_color = [255, 0, 0] # Red
                    builder.primitive('/radar_passed_filter_targets')\
                        .circle([x, y, z], .5)\
                        .style({'fill_color': fill_color})\
                        .id(str(target['targetId']))
                else:
                    fill_color = [255, 255, 0] # Yellow
                    builder.primitive('/radar_filtered_out_targets')\
                        .circle([x, y, z], .5)\
                        .style({'fill_color': fill_color})\
                        .id(str(target['targetId']))


                if to_path_prediction:
                    fill_color = [0, 0, 0] # Black
                    builder.primitive('/radar_crucial_targets')\
                        .circle([x, y, z], .5)\
                        .style({'fill_color': fill_color})\
                        .id(str(target['targetId']))

        except Exception as e:
            print('Crashed in draw radar targets:', e)


    def _draw_tracking_targets(self, tracking_output, builder: xviz.XVIZBuilder):
        try:
            if 'tracks' in tracking_output:            
                min_confidence = 0.1
                min_hits = 2
                for track in tracking_output['tracks']:
                    if track['score'] > min_confidence and track['hitStreak'] > min_hits:
                        (x, y, z) = get_object_xyz(track, 'angle', 'distance', radar_ob=False)

                        if track['radarDistCamFrame'] != self.track_history.get(track['trackId'], -1)\
                            and track['radarDistCamFrame'] > 0.1:
                            fill_color = [0, 255, 0] # Green
                            builder.primitive('/tracking_id')\
                                    .text(track['trackId'])\
                                    .position([x, y, z+.1])\
                                    .id(track['trackId'])
                        else:
                            fill_color = [0, 0, 255] # Blue

                        builder.primitive('/tracking_targets')\
                            .circle([x, y, z], .5)\
                            .style({'fill_color': fill_color})\
                            .id(track['trackId'])

                        self.track_history[track['trackId']] = track['radarDistCamFrame']
        except Exception as e:
            print('Crashed in draw tracking targets:', e)


    def _draw_camera_targets(self, camera_output, builder: xviz.XVIZBuilder):
        try:
            for target in camera_output['targets']:
                (x, y, z) = get_object_xyz(target, 'objectAngle', 'objectDistance', radar_ob=False)
                if target['label'] == 'qrcode':
                    continue
                fill_color = [0, 255, 255] # Cyan

                builder.primitive('/camera_targets')\
                    .circle([x, y, z], .5)\
                    .style({'fill_color': fill_color})\
                    .id(target['label'])

        except Exception as e:
            print('Crashed in draw camera targets:', e)

    
    def _draw_machine_state(self, machine_state, builder: xviz.XVIZBuilder):
        try:
            vehicle_states = machine_state['vehicleStates']
            if vehicle_states:
                for vehicle, state in vehicle_states.items():
                    if vehicle == 'tractor':
                        self.tractor_state = (self.index, state)
                    else:
                        self.combine_states[vehicle] = (self.index, state)
                
            tractor_last_idx, tractor_state = self.tractor_state

            if self.tractor_state is None\
                or self.index - tractor_last_idx > 2:
                return

            tractor_heading = (math.pi / 2) - (tractor_state['heading'] * math.pi / 180)
            # tractor heading always drawn as 0 since everything is relative to it
            tractor_rel_heading_xyz = get_object_xyz_primitive(radial_dist=5.0, angle_radians=0.0)
            t_r_x, t_r_y, _ = tractor_rel_heading_xyz
            z = 0.5
            tractor_color = [0, 128, 128]
            builder.primitive('/tractor_heading')\
                .polyline([0, 0, z, t_r_x, t_r_y, z])\
                .style({'stroke_width': 0.3,
                        "stroke_color": tractor_color})\
                .id('tractor_heading')
            
            for last_updated_index, combine_state in self.combine_states.values():
                if self.index - last_updated_index > 2:
                    continue

                utm_zone = machine_state['opState']['refUtmZone']
                x, y = transform_combine_to_local(combine_state, tractor_state, utm_zone)
                combine_color = [128, 0, 128] # Black

                combine_heading = (math.pi / 2) - (combine_state['heading'] * math.pi / 180)
                combine_heading_relative_to_tractor = combine_heading - tractor_heading
                combine_rel_heading_xyz = get_object_xyz_primitive(radial_dist=3.0, angle_radians=combine_heading_relative_to_tractor)

                c_r_x, c_r_y, _ = combine_rel_heading_xyz
                
                builder.primitive('/combine_position')\
                    .circle([x, y, z], .5)\
                    .style({'fill_color': combine_color})\
                    .id('combine')
                builder.primitive('/combine_region')\
                    .circle([x, y, z-.1], self.combine_length)\
                    .id("combine_bubble: " + str(self.combine_length))

                builder.primitive('/combine_heading')\
                    .polyline([x, y, z, x+c_r_x, y+c_r_y, z])\
                    .style({'stroke_width': 0.3, 
                            "stroke_color": combine_color})\
                    .id('combine_heading')

        except Exception as e:
            print('Crashed in draw machine state:', e)

    
    def _draw_predicted_path(self, machine_state, builder: xviz.XVIZBuilder):
        try:
            vehicle_states = machine_state['vehicleStates']
            if 'tractor' in vehicle_states:
                tractor_state = vehicle_states['tractor']
                speed = tractor_state['speed']
                curvature = tractor_state['curvature']
                wheel_angle = curvature * self.wheel_base / 1000

                self.path_prediction.predict(wheel_angle, speed)

                left_p = np.array(list(
                            map(get_object_xyz_primitive,
                                self.path_prediction.left_p[:, 0],
                                self.path_prediction.left_p[:, 1])))\
                            .flatten()
                right_p = np.flipud(np.array(list(
                            map(get_object_xyz_primitive,
                                self.path_prediction.right_p[:, 0],
                                self.path_prediction.right_p[:, 1]))))\
                            .flatten()
                
                vertices = list(np.concatenate((left_p, right_p)))

                builder.primitive('/predicted_path')\
                        .polyline(vertices)\
                        .id('predicted_paths')

        except Exception as e:
            print('Crashed in draw predicted path:', e)
    

    def _draw_field_definition(self, field_definition, builder: xviz.XVIZBuilder):
        try:
            pass
        except Exception as e:
            print('Crashed in draw field definition:', e)


    def _draw_planned_path(self, planned_path, builder: xviz.XVIZBuilder):
        try:
            if planned_path.size == 0:
                self.planned_path = None
                return
            else:
                pass
        except Exception as e:
            print('Crashed in draw planned path:', e)


def get_object_xyz(ob, angle_key, dist_key, radar_ob=False):
    x = math.cos(ob[angle_key]) * ob[dist_key]
    y = math.sin(ob[angle_key]) * ob[dist_key]
    z = 1.5

    if not radar_ob:
        nose_to_cab = 3.2131 # meters
        x -= nose_to_cab

    return (x, y, z)


def get_object_xyz_primitive(radial_dist, angle_radians):
    x = math.cos(angle_radians) * radial_dist
    y = math.sin(angle_radians) * radial_dist
    z = 1.0

    return (x, y, z)
