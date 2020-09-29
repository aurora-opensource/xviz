import math
import time
from pathlib import Path
from collections import deque
import numpy as np

from google.protobuf.json_format import MessageToDict
from protobuf_APIs import falconeye_pb2

from scenarios.utils.com_manager import ComManager, MqttConst
from scenarios.utils.filesystem import get_collector_instances, load_config
from scenarios.utils.gis import transform_combine_to_local, utm_array_to_local, get_combine_region
from scenarios.utils.image import postprocess, show_image
from scenarios.utils.read_protobufs import deserialize_collector_output,\
                                            extract_collector_output, extract_collector_output_slim

from scenarios.safety_subsystems.radar_filter import RadarFilter
from scenarios.safety_subsystems.path_prediction import PathPrediction

import xviz
import xviz.builder as xbuilder


CAB_TO_NOSE = 3.2131
TRACTOR_GPS_TO_REAR_AXLE = 1.9304

COMBINE_GPS_TO_CENTER = 1.0
COMBINE_WIDTH = 8.0


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
        collector_config = load_config(str(configfile))

        collector_output_file = collector_config['collector_output_file']
        extract_directory = collector_config['extract_directory']
        self.collector_instances = get_collector_instances(collector_output_file, extract_directory)

        self.rectangular_combine_region = collector_config['rectangular_combine_region']
        self.circular_combine_region = collector_config['circular_combine_region']
        self.mqtt_enabled = collector_config['mqtt_enabled']
        if self.mqtt_enabled:
            self.mqtt_tracking_outputs = []
            comm = ComManager()
            comm.subscribe(MqttConst.TRACKS_TOPIC, self.store_tracking_output)
        
        configfile = Path(__file__).parents[3] / 'Global-Configs' / 'Tractors' / 'John-Deere' / '8RIVT_WHEEL.yaml'
        global_config = load_config(str(configfile))
        radar_safety_config = global_config['safety']['radar']
        self.combine_length = radar_safety_config['combine_length']
        self.stop_distance = radar_safety_config['stop_threshold_default']
        self.slowdown_distance = radar_safety_config['slowdown_threshold_default']

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
            'machine_width': global_config['safety']['object_tracking']['path_width'] * 1.5
        }
        min_predictive_speed = global_config['guidance']['safety']['predictive_slowdown_speed_mph']
        self.path_prediction = PathPrediction(prediction_args, min_predictive_speed)

        self.utm_zone = ''
        self.tractor_state = deque(maxlen=10)
        self.combine_states = {}
        self.planned_path = None
        self.field_definition = None
        self.sync_status = None
        self.control_signal = None

    
    def reset_values(self):
        self.tractor_state.clear()
        self.combine_states = {}
        self.planned_path = None
        self.field_definition = None
        self.sync_status = None
        self.control_signal = None
        self.index = 0

    
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

            builder.stream("/radar_filtered_out_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [255, 255, 0]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/radar_passed_filter_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [255, 0, 0]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/radar_crucial_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [0, 0, 0]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

            builder.stream("/camera_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [0, 255, 255]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

            builder.stream("/tracking_targets")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/tracking_id")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [0, 0, 0]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.TEXT)

            combine_color = [128, 0, 128]
            builder.stream("/combine_position")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': combine_color})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/combine_heading")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({
                    'stroke_width': 0.3, 
                    'stroke_color': combine_color
                })\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            
            if self.rectangular_combine_region:
                builder.stream("/combine_region")\
                    .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                    .stream_style({
                        'stroke_width': 0.3,
                        'stroke_color': [0, 20, 128, 50]
                    })\
                    .category(xviz.CATEGORY.PRIMITIVE)\
                    .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            if self.circular_combine_region:
                builder.stream("/combine_region_circle")\
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
                .stream_style({'stroke_color': [40, 150, 40, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            # builder.stream("/predicted_path_discrete")\
            #     .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
            #     .stream_style({'fill_color': [0, 128, 128, 128]})\
            #     .category(xviz.CATEGORY.PRIMITIVE)\
            #     .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/predicted_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [0, 128, 128, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)
            builder.stream("/commanded_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [128, 0, 128, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/planned_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({
                    'stroke_width': 0.3,
                    'stroke_color': [128, 0, 128, 128]
                })\
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
            self._draw_collector_instance(builder, timestamp)
            data = builder.get_message()

            return {
                'type': 'xviz/state_update',
                'data': data.to_object()
            }
        except Exception as e:
            print("Crashed in get_message:", e)


    def _draw_measuring_references(self, builder: xviz.XVIZBuilder, timestamp):
        radial_distances = set([5, 10, 15, 20, 25, 30])
        radial_distances.add(self.slowdown_distance)
        radial_distances.add(self.stop_distance)
        radial_distances = sorted(radial_distances, reverse=True)

        for r in radial_distances:
            builder.primitive('/measuring_circles_lbl')\
                .text(str(r))\
                .position([r+CAB_TO_NOSE, 0, .1])\
                .id(f'{r}lb')

            if r == self.slowdown_distance:
                builder.primitive('/measuring_circles')\
                    .circle([CAB_TO_NOSE, 0, 0], r)\
                    .style({'stroke_color': [255, 200, 0, 70]})\
                    .id('slowdown: ' + str(r))
            elif r == self.stop_distance:
                builder.primitive('/measuring_circles')\
                    .circle([CAB_TO_NOSE, 0, 0], r)\
                    .style({'stroke_color': [255, 50, 10, 70]})\
                    .id('stop: ' + str(r))
            else:
                builder.primitive('/measuring_circles')\
                    .circle([CAB_TO_NOSE, 0, 0], r)\
                    .id(str(r))

        cam_fov = [-28.5, 28.5] # 57 deg
        radar_fov = [-27, -13.5, -6.75, 0, 6.75, 13.5, 27] # 54 degrees

        for c_phi in cam_fov:
            r = 40
            label = (r, c_phi)
            (x, y, z) = get_object_xyz_primitive(r, c_phi*math.pi/180)
            x += CAB_TO_NOSE
            vertices = [CAB_TO_NOSE, 0, 0, x, y, z]
            builder.primitive('/camera_fov')\
                .polyline(vertices)\
                .id("cam_fov: "+str(label))

        for r_phi in radar_fov:
            r = 40
            (x, y, z) = get_object_xyz_primitive(r, r_phi*math.pi/180)
            x += CAB_TO_NOSE
            builder.primitive('/measuring_circles_lbl')\
                .text(str(r_phi))\
                .position([x, y, z])\
                .id(str(r_phi)+'lb')
            if r_phi == radar_fov[0] or r_phi == radar_fov[-1]:
                label = (r, r_phi)
                vertices = [CAB_TO_NOSE, 0, 0, x, y, z]
                builder.primitive('/radar_fov')\
                    .polyline(vertices)\
                    .id("radar_fov: "+str(label))


    def _draw_collector_instance(self, builder: xviz.XVIZBuilder, timestamp):
        try:
            builder.pose()\
                .timestamp(timestamp)

            if self.index == len(self.collector_instances):
                self.reset_values()

            collector_output = self.collector_instances[self.index]

            collector_output, is_slim_output = deserialize_collector_output(collector_output)
            if is_slim_output:
                img, camera_output, radar_output, tracking_output, machine_state,\
                    field_definition, planned_path, sync_status, control_signal\
                    = extract_collector_output_slim(collector_output)
            else:
                img, camera_output, radar_output,\
                    tracking_output, machine_state = extract_collector_output(collector_output)
                field_definition = None
                planned_path = None
                sync_status = None
                control_signal = None

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
                self.update_machine_state(machine_state)

            if field_definition is not None:
                self.field_definition = field_definition

            if planned_path is not None:
                if planned_path.size > 0:
                    self.planned_path = planned_path.reshape(-1, 2)
                else:
                    self.planned_path = None
            
            if sync_status is not None:
                self.sync_status = sync_status
            
            if control_signal is not None:
                self.control_signal = control_signal

            if self.tractor_state:
                if self.is_vehicle_state_old(self.tractor_state[-1]):
                    print('old tractor state')
                    self.tractor_state.clear()
                else:
                    self._draw_machine_state(builder)
                    self._draw_predicted_path(builder)
                    self._draw_planned_path(builder)
                    self._draw_field_definition(builder)
                    self._draw_commanded_path(builder)
                    # TODO: draw something with the sync status

            if img is not None:
                if camera_output is not None:
                    img = postprocess(img, camera_output)
                show_image(img)

            # if self.index == 0:
            #     print('start time:', time.gmtime(float(collector_output.timestamp)))
            # elif self.index == len(self.collector_instances) - 1:
            #     print('end time:', time.gmtime(float(collector_output.timestamp)))

            self.index += 1

        except Exception as e:
            print('Crashed in draw collector instance:', e)


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

                    builder.primitive('/radar_passed_filter_targets')\
                        .circle([x, y, z], .5)\
                        .id(str(target['targetId']))
                else:
                    builder.primitive('/radar_filtered_out_targets')\
                        .circle([x, y, z], .5)\
                        .id(str(target['targetId']))


                if to_path_prediction:
                    builder.primitive('/radar_crucial_targets')\
                        .circle([x, y, z], .5)\
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
                        else:
                            fill_color = [0, 0, 255] # Blue

                        builder.primitive('/tracking_targets')\
                            .circle([x, y, z], .5)\
                            .style({'fill_color': fill_color})\
                            .id(track['trackId'])

                        text = f"[{track['classId'][0]}]{track['trackId']}"
                        builder.primitive('/tracking_id')\
                                .text(text)\
                                .position([x, y, z+.1])\
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

                builder.primitive('/camera_targets')\
                    .circle([x, y, z], .5)\
                    .id(target['label'])

        except Exception as e:
            print('Crashed in draw camera targets:', e)

    
    def _draw_machine_state(self, builder: xviz.XVIZBuilder):
        try:
            _, tractor_state = self.tractor_state[-1]
            tractor_heading = tractor_state['heading']  # degrees
            
            for combine_state_tuple in self.combine_states.values():
                if self.is_vehicle_state_old(combine_state_tuple):
                    print('old combine state')
                    continue

                _, combine_state = combine_state_tuple
                x, y = transform_combine_to_local(combine_state, tractor_state, self.utm_zone)
                x -= (CAB_TO_NOSE + TRACTOR_GPS_TO_REAR_AXLE)
                z = 0.5

                combine_heading = combine_state['heading']  # degrees
                relative_combine_heading = (tractor_heading - combine_heading) * math.pi / 180
                combine_rel_heading_xyz = get_object_xyz_primitive(radial_dist=3.0,
                                                                    angle_radians=relative_combine_heading)
                c_r_x, c_r_y, _ = combine_rel_heading_xyz

                combine_center_x = x - (COMBINE_GPS_TO_CENTER * math.cos(relative_combine_heading))
                combine_center_y = y - (COMBINE_GPS_TO_CENTER * math.sin(relative_combine_heading))

                combine_region = get_combine_region(
                    combine_center_x, combine_center_y,
                    relative_combine_heading, self.combine_length, COMBINE_WIDTH
                )

                vertices = list(np.column_stack((
                    combine_region,
                    np.full(combine_region.shape[0], z)
                )).flatten())
                
                builder.primitive('/combine_position')\
                    .circle([combine_center_x, combine_center_y, z], .5)\
                    .id('combine')

                if self.rectangular_combine_region:
                    builder.primitive('/combine_region')\
                        .polyline(vertices)\
                        .id('combine_region')
                if self.circular_combine_region:
                    builder.primitive('/combine_region_circle')\
                        .circle([combine_center_x, combine_center_y, z-.1], self.combine_length/2)\
                        .id('combine_region_circle')

                builder.primitive('/combine_heading')\
                    .polyline([
                        combine_center_x, combine_center_y, z,
                        combine_center_x+c_r_x, combine_center_y+c_r_y, z
                        ])\
                    .id('combine_heading')
                

        except Exception as e:
            print('Crashed in draw machine state:', e)

    
    def _draw_predicted_path(self, builder: xviz.XVIZBuilder):
        try:
            _, tractor_state = self.tractor_state[-1]
            speed = tractor_state['speed']
            curvature = tractor_state['curvature']
            # curvature = get_average_curvature(self.tractor_state)
            wheel_angle = curvature * self.wheel_base / 1000
            self.path_prediction.predict(wheel_angle, speed)

            z = 0.9
            left = np.column_stack((
                self.path_prediction.left,
                np.full(self.path_prediction.left.shape[0], z)
            ))
            right = np.column_stack((
                np.flipud(self.path_prediction.right),
                np.full(self.path_prediction.right.shape[0], z)
            ))
            left[:, 0] += CAB_TO_NOSE
            right[:, 0] += CAB_TO_NOSE

            vertices = list(np.concatenate((
                left.flatten(),
                right.flatten()
            )))

            builder.primitive('/predicted_path')\
                .polyline(vertices)\
                .id('predicted_path')

            # view the discrete points in the predicted path
            # for i in range(len(vertices) // 3):
            #     idx = i * 3
            #     x, y, z = vertices[idx], vertices[idx+1], vertices[idx+2]
            #     builder.primitive('/predicted_path_discrete')\
            #         .circle([x, y, z], .2)
            #         .id('predicted_path_node')

        except Exception as e:
            print('Crashed in draw predicted path:', e)


    def _draw_commanded_path(self, builder: xviz.XVIZBuilder):
        try:
            if self.control_signal is None:
                return

            speed = self.control_signal['setSpeed']
            curvature = self.control_signal['commandCurvature']
            wheel_angle = curvature * self.wheel_base / 1000
            self.path_prediction.predict(wheel_angle, speed)

            z = 0.9
            left = np.column_stack((
                self.path_prediction.left,
                np.full(self.path_prediction.left.shape[0], z)
            ))
            right = np.column_stack((
                np.flipud(self.path_prediction.right),
                np.full(self.path_prediction.right.shape[0], z)
            ))
            left[:, 0] += CAB_TO_NOSE
            right[:, 0] += CAB_TO_NOSE

            vertices = list(np.concatenate((
                left.flatten(),
                right.flatten()
            )))

            builder.primitive('/commanded_path')\
                .polyline(vertices)\
                .id('commanded_path')

        except Exception as e:
            print('Crashed in draw commanded path:', e)


    def _draw_planned_path(self, builder: xviz.XVIZBuilder):
        try:
            if self.planned_path is None:
                return

            _, tractor_state = self.tractor_state[-1]
            xy_array = utm_array_to_local(tractor_state, self.utm_zone, self.planned_path)
            z = 1.0

            vertices = list(np.column_stack(
                (xy_array, np.full(xy_array.shape[0], z))
            ).flatten())

            builder.primitive('/planned_path')\
                .polyline(vertices)\
                .id('planned_path')

        except Exception as e:
            print('Crashed in draw planned path:', e)
    

    def _draw_field_definition(self, builder: xviz.XVIZBuilder):
        try:
            if self.field_definition is None:
                return

            poly = []
            if self.field_definition['type'] == 'MultiPolygon':
                for polygons in self.field_definition['coordinates']:
                    for polygon in polygons:
                        poly.append(np.array(polygon))

            else:
                for polygon in self.field_definition['coordinates']:
                    poly.append(np.array(polygon))

            _, tractor_state = self.tractor_state[-1]
            for p in poly:
                xy_array = utm_array_to_local(tractor_state, self.utm_zone, p)
                xy_array[:, 0] -= (CAB_TO_NOSE + TRACTOR_GPS_TO_REAR_AXLE)
                z = 1.0
                vertices = list(np.column_stack(
                    (xy_array, np.full(xy_array.shape[0], z))
                ).flatten())

                builder.primitive('/field_definition')\
                    .polyline(vertices)\
                    .id('field_definition')

        except Exception as e:
            print('Crashed in draw field definition:', e)

    
    def update_machine_state(self, machine_state):
        if not self.utm_zone:
            # only need to set it once
            self.utm_zone = machine_state['opState']['refUtmZone']

        vehicle_states = machine_state['vehicleStates']
        if vehicle_states:
            for vehicle, state in vehicle_states.items():
                if vehicle == 'tractor':
                    self.tractor_state.append((self.index, state))
                else:
                    self.combine_states[vehicle] = (self.index, state)
    

    def is_vehicle_state_old(self, vehicle_state_tuple):
        last_updated_index, _ = vehicle_state_tuple
        return self.index - last_updated_index > 5


def get_object_xyz(ob, angle_key, dist_key, radar_ob=False):
    x = math.cos(ob[angle_key]) * ob[dist_key]
    y = math.sin(ob[angle_key]) * ob[dist_key]
    z = 1.5

    if not radar_ob:
        x -= CAB_TO_NOSE

    return (x, y, z)


def get_object_xyz_primitive(radial_dist, angle_radians):
    x = math.cos(angle_radians) * radial_dist
    y = math.sin(angle_radians) * radial_dist
    z = 1.0

    return (x, y, z)


def get_average_curvature(tractor_state_history):
    curvature_sum = 0
    for i, state_tuple in enumerate(tractor_state_history):
        _, state = state_tuple
        curvature_sum += state['curvature']

    return curvature_sum / (i + 1)
