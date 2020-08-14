import math
import time
import shutil
import cv2
import utm
import yaml
import numpy as np
from pathlib import Path
from google.protobuf.json_format import MessageToDict
from protobuf_APIs import collector_pb2, gandalf_pb2, falconeye_pb2, radar_pb2, camera_pb2

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
        self.id_tracks = {}
        self.id_last = 1
        self.data = []

        collector_config = self.load_config(configfile='scenarios/collector-scenario-config.yaml')
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

        global_config = self.load_config(configfile="../../Global-Configs/Tractors/John-Deere/8RIVT_WHEEL.yaml")
        radar_safety_config = global_config['safety']['radar']
        self.combine_length = radar_safety_config['combine_length']
        self.distance_threshold = radar_safety_config['distance_threshold']
        self.slowdown_threshold = radar_safety_config['slowdown_threshold']

        pfilter_enabled = False
        qfilter_enabled = radar_safety_config['enable_queue_filter']
        queue_size = 12
        consecutive_min = radar_safety_config['consecutive_detections']
        phi_sdv_max = radar_safety_config['phi_sdv_threshold']
        pf_pexist_min = radar_safety_config['confidence_threshold']

        qf_pexist_min = radar_safety_config['qf_confidence_threshold']
        pf_dbpower_min = radar_safety_config['d_bpower_threshold']
        qf_dbpower_min = radar_safety_config['qf_d_bpower_threshold']
        nan_threshold = radar_safety_config['qf_none_ratio_threshold']

        self.radar_filter = RadarFilter(pfilter_enabled, qfilter_enabled, queue_size,
                                        consecutive_min, pf_pexist_min, qf_pexist_min,
                                        pf_dbpower_min, qf_dbpower_min, phi_sdv_max, nan_threshold)

        self.wheel_base = global_config['guidance']['wheel_base']
        prediction_args = {
            'wheel_base': self.wheel_base,
            'machine_width': global_config['navigation']['machine_width']
        }
        self.path_prediction = PathPrediction(prediction_args)


    def load_config(self, configfile):
        with open(configfile, 'r') as f:
            config = yaml.safe_load(f)

        return config


    def get_metadata(self):
        if not self._metadata:
            builder = xviz.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz.CATEGORY.POSE)
            builder.stream("/tractor_heading")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/radar_targets")\
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

            builder.stream("/predicted_path")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'stroke_color': [0,128, 128, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)

            builder.stream("/radar_fov")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/camera_fov")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

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
            self._draw_collector_output(builder, timestamp)
            data = builder.get_message()

            return {
                'type': 'xviz/state_update',
                'data': data.to_object()
            }
        except Exception as e:
            print("Crashed in get_message:", e)


    def _draw_measuring_references(self, builder: xviz.XVIZBuilder, timestamp):

        builder.primitive('/measuring_circles_lbl').text("30").position([30, 0, .1]).id('30lb')
        builder.primitive('/measuring_circles_lbl').text("25").position([25, 0, .1]).id('25lb')
        builder.primitive('/measuring_circles_lbl').text("20").position([20, 0, .1]).id('20lb')
        builder.primitive('/measuring_circles_lbl').text("15").position([15, 0, .1]).id('15lb')
        builder.primitive('/measuring_circles_lbl').text("10").position([10, 0, .1]).id('10lb')
        builder.primitive('/measuring_circles_lbl').text("5").position([5, 0, .1]).id('5lb')

        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], self.slowdown_threshold)\
                                                .style({'stroke_color': [255, 200, 0, 70]})\
                                                .id('slowdown: ' + str(self.slowdown_threshold))
        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], 25).id('25')
        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], self.distance_threshold)\
                                                .style({'stroke_color': [255, 50, 10, 70]})\
                                                .id('stop: ' + str(self.distance_threshold))
        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], 15).id('15')
        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], 10).id('10')
        builder.primitive('/measuring_circles').circle([cab_to_nose, 0, 0], 5).id('5')

        cam_fov = [-28.5, 28.5] # 57 deg
        radar_fov = [-27, -13.5, -6.75, 0, 6.75, 13.5, 27] # 54 degrees
        radial_distances = [5, 10, 20, 30, 35, 40]
        for r in radial_distances:
            for c_phi in cam_fov:
                label = (r, c_phi)
                (x, y, z) = self.get_object_xyz_primitive(r+cab_to_nose, c_phi*math.pi/180)
                fill_color = [206, 205, 203]
                builder.primitive('/camera_fov').circle([x, y, z], 0.15)\
                    .style({'fill_color': fill_color})\
                    .id("cam_fov: "+str(label))

            for r_phi in radar_fov:
                label = (r, r_phi)
                (x, y, z) = self.get_object_xyz_primitive(r+cab_to_nose, r_phi*math.pi/180)
                fill_color = [210,105,30]
                builder.primitive('/radar_fov').circle([x, y, z], 0.15)\
                    .style({'fill_color': fill_color})\
                    .id("radar_fov: "+str(label))
                if r == radial_distances[-1]:
                    builder.primitive('/measuring_circles_lbl').text(str(r_phi)).position([x, y, z]).id(str(r_phi)+'lb')


    def _draw_collector_output(self, builder: xviz.XVIZBuilder, timestamp):
        try:
            builder.pose()\
                .timestamp(timestamp)

            if self.index == len(self.collector_outputs):
                self.index = 0

            collector_output = self.collector_outputs[self.index]

            collector_output = self.deserialize_collector_output(collector_output)
            img, camera_output, radar_output, tracking_output, machine_state = self.extract_collector_output_content(collector_output)

            if camera_output is not None:
                self._draw_camera_targets(camera_output, builder)
                img = self.postprocess(img, camera_output)

            if img is not None:
                self.show_image(img)

            if radar_output is not None:
                self._draw_radar_targets(radar_output, builder)

            if tracking_output is not None:
                self._draw_tracking_targets(tracking_output, builder)

            if machine_state is not None:
                self._draw_machine_state(machine_state, builder)
                self._draw_predicted_path(machine_state, builder)

            # if self.index == 0:
            #     print('start time:', time.gmtime(float(collector_output.timestamp)))
            # elif self.index == len(self.collector_outputs) - 1:
            #     print('end time:', time.gmtime(float(collector_output.timestamp)))

            self.index += 1

        except Exception as e:
            print('Crashed in draw perception outputs:', e)


    def _draw_radar_targets(self, radar_output, builder: xviz.XVIZBuilder):
        try:
            for target in radar_output['targets'].values():
                if abs(target['dr']) < 0.1 and abs(target['phi']) < 0.01:
                    continue 
                to_path_prediction = False
                (x, y, z) = self.get_object_xyz(target, 'phi', 'dr', radar_ob=True)
    
                if self.radar_filter.is_valid_target(target['targetId'], target):
                    if self.radar_filter.filter_targets_until_path_prediction(target):
                        to_path_prediction = True
                 
                    fill_color = [255, 0, 0] # Red
                else:
                    fill_color = [255, 255, 0] # Yellow

                builder.primitive('/radar_targets')\
                    .circle([x, y, z], .5)\
                    .style({'fill_color': fill_color})\
                    .id(str(target['targetId']))

                if to_path_prediction:
                    fill_color = [0, 0, 0] # Black
                    builder.primitive('/radar_crucial_targets')\
                        .circle([x, y, z], .5)\
                        .style({'fille_color': fill_color})\
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
                        (x, y, z) = self.get_object_xyz(track, 'angle', 'distance', radar_ob=False)

                        if track['radarDistCamFrame'] > 0.1:
                            fill_color = [0, 255, 0] # Green
                        else:
                            fill_color = [0, 0, 255] # Blue

                        builder.primitive('/tracking_targets')\
                            .circle([x, y, z], .5)\
                            .style({'fill_color': fill_color})\
                            .id(track['trackId'])

        except Exception as e:
            print('Crashed in draw tracking targets:', e)


    def _draw_camera_targets(self, camera_output, builder: xviz.XVIZBuilder):
        try:
            for target in camera_output['targets']:
                (x, y, z) = self.get_object_xyz(target, 'objectAngle', 'objectDistance', radar_ob=False)
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
            if 'combine' and 'tractor' in vehicle_states:
                combine_state = vehicle_states['combine']
                tractor_state = vehicle_states['tractor']
                operation_state = machine_state['opState']
                if operation_state['refUtmZone']:
                    utm_zone = operation_state['refUtmZone']
                else:
                    utm_zone = None
                x, y = transform_combine_to_local(combine_state, tractor_state, utm_zone)
                z = 0.5
                fill_color = [128, 0, 128] # Black

                combine_heading = (math.pi / 2) - (combine_state["heading"]* math.pi / 180)
                tractor_heading = (math.pi / 2) - (tractor_state["heading"]* math.pi / 180)

                combine_heading_relative_to_tractor = combine_heading - tractor_heading
                combine_rel_heading_xyz = self.get_object_xyz_primitive(radial_dist=3.0, angle_radians=combine_heading_relative_to_tractor)
                # tractor has a fixed heading
                tractor_rel_heading_xyz = self.get_object_xyz_primitive(radial_dist=5.0, angle_radians=0.0)

                c_r_x, c_r_y, _ = combine_rel_heading_xyz
                t_r_x, t_r_y, _ = tractor_rel_heading_xyz

                builder.primitive('/combine_position')\
                    .circle([x, y, z], .5)\
                    .style({'fill_color': fill_color})\
                    .id('combine')
                builder.primitive('/combine_region')\
                    .circle([x, y, z-.1], self.combine_length)\
                    .id("combine_bubble: " + str(self.combine_length))

                builder.primitive('/combine_heading')\
                    .polyline([x, y, z, x+c_r_x, y+c_r_y, z])\
                    .style({'stroke_width': 0.3, 
                            "stroke_color": fill_color})\
                    .id('combine_heading')

                tractor_color = [0,128, 128]
                builder.primitive('/tractor_heading')\
                    .polyline([0, 0, z, t_r_x, t_r_y, z])\
                    .style({'stroke_width': 0.3,
                            "stroke_color": tractor_color})\
                    .id('tractor_heading')

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
                            map(self.get_object_xyz_primitive,
                                self.path_prediction.left_p[:, 0],
                                self.path_prediction.left_p[:, 1])))\
                            .flatten()
                right_p = np.flipud(np.array(list(
                            map(self.get_object_xyz_primitive,
                                self.path_prediction.right_p[:, 0],
                                self.path_prediction.right_p[:, 1]))))\
                            .flatten()
                
                vertices = list(np.concatenate((left_p, right_p)))

                builder.primitive('/predicted_path')\
                        .polyline(vertices)\
                        .id('predicted_paths')

        except Exception as e:
            print('Crashed in draw predicted path:', e)
    

    def get_object_xyz(self, ob, angle_key, dist_key, radar_ob=False):
        x = math.cos(ob[angle_key]) * ob[dist_key]
        y = math.sin(ob[angle_key]) * ob[dist_key]
        z = 1.5

        if not radar_ob:
            nose_to_cab = 3.2131 # meters
            x -= nose_to_cab

        return (x, y, z)

    def get_object_xyz_primitive(self, radial_dist, angle_radians):
        x = math.cos(angle_radians) * radial_dist
        y = math.sin(angle_radians) * radial_dist
        z = 1.0

        return (x, y, z)


    def deserialize_collector_output(self, file_path):
        collector_output = collector_pb2.CollectorOutput()
        collector_output.ParseFromString(Path(file_path).read_bytes())
        return collector_output


    def extract_collector_output_content(self, collector_output):
        if collector_output.frame:
            frame = self.extract_image(collector_output.frame)
        else:
            print('missing frame from collector output')
            frame = None

        if collector_output.camera_output:
            camera_output = camera_pb2.CameraOutput()
            camera_output.ParseFromString(collector_output.camera_output)
            camera_output = MessageToDict(camera_output, including_default_value_fields=True)
        else:
            camera_output = None

        if collector_output.radar_output:
            radar_output = radar_pb2.RadarOutput()
            radar_output.ParseFromString(collector_output.radar_output)
            radar_output = MessageToDict(radar_output, including_default_value_fields=True)
        else:
            radar_output = None

        if collector_output.tracking_output:
            tracking_output = falconeye_pb2.TrackingOutput()
            tracking_output.ParseFromString(collector_output.tracking_output)
            tracking_output = MessageToDict(tracking_output, including_default_value_fields=True)
        else:
            tracking_output = None

        if collector_output.machine_state:
            machine_state = gandalf_pb2.MachineState()
            machine_state.ParseFromString(collector_output.machine_state)
            machine_state = MessageToDict(machine_state, including_default_value_fields=True)
        else:
            machine_state = None

        return frame, camera_output, radar_output, tracking_output, machine_state


    def extract_image(self, img_bytes):
        encoded_img = np.frombuffer(img_bytes, dtype=np.uint8) # decode bytes
        decimg = cv2.imdecode(encoded_img, 1) # uncompress image
        return decimg


    def show_image(self, image):
        image = cv2.resize(image, (0, 0), fx=.7, fy=.7)
        cv2.imshow('collector-scenario', image)
        cv2.moveWindow('collector-scenario', 0, 0)
        cv2.waitKey(1)


    def postprocess(self, image, camera_output):
        for target in camera_output['targets']:
            tl, br = target['topleft'], target['bottomright']
            tl['x'], tl['y'] = int(tl['x']), int(tl['y'])
            br['x'], br['y'] = int(br['x']), int(br['y'])

            label = target['label']
            conf = str("%.1f" % (target['confidence'] * 100)) + '%'

            thickness = (image.shape[0] + image.shape[1]) // 1000
            fontFace = cv2.FONT_HERSHEY_SIMPLEX  # 'font/FiraMono-Medium.otf',
            fontScale = 1
            label_size = cv2.getTextSize(label, fontFace, fontScale, thickness)
            if tl['y'] - label_size[1] >= 0:
                text_origin = (tl['x'], tl['y'] - label_size[1])
            else:
                text_origin = (tl['x'], tl['y'] + 1)

            box_color = (241, 240, 236)
            cv2.rectangle(image, (tl['x'], tl['y']), (br['x'], br['y']),
                        box_color, thickness)
            cv2.putText(image, conf, text_origin, fontFace,
                        fontScale, box_color, 2)

        return image

def transform_combine_to_local(combine_state, tractor_state, utm_zone):
    combine_x, combine_y = latlon_to_utm(combine_state['latitude'], combine_state['longitude'], utm_zone)
    tractor_x, tractor_y = latlon_to_utm(tractor_state['latitude'], tractor_state['longitude'], utm_zone)
    dx, dy = utm_to_local(combine_x, combine_y, tractor_x, tractor_y, tractor_state['heading'])
    return dx, dy

def latlon_to_utm(lat, lon, zone=None):
    zone_number, zone_letter = parse_utm_zone(zone)
    converted = utm.from_latlon(
        lat, lon,
        force_zone_number=zone_number,
        force_zone_letter=zone_letter
    )
    return converted[0], converted[1]  # only return easting, northing

def parse_utm_zone(zone):
    if zone is None:
        return None, None
    index = 0
    zone_num = ''
    while zone[index].isdigit():
        zone_num += zone[index]
        index += 1
    return int(zone_num), zone[index]

def utm_to_local(translate_x, translate_y, reference_x, reference_y, heading):
    theta = (math.pi / 2) - (heading * math.pi / 180)
    dx_a = translate_x - reference_x
    dy_a = translate_y - reference_y
    dx = (math.cos(theta) * dx_a) + (math.sin(theta) * dy_a)
    dy = -(math.sin(theta) * dx_a) + (math.cos(theta) * dy_a)
    return dx, dy

def establish_fresh_directory(path):
    if path.is_dir():
        clear_directory(path)
    else:
        path.mkdir(parents=True)

def clear_directory(path):
    for child in path.glob('*.txt'):
        child.unlink()