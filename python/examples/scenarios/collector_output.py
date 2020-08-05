import math
import time
import shutil
import cv2
import yaml
import numpy as np
from collections import deque
from pathlib import Path
from google.protobuf.json_format import MessageToDict

import xviz
import xviz.builder as xbuilder

from protobuf_APIs import collector_pb2, falconeye_pb2, radar_pb2, camera_pb2


DEG_1_AS_RAD = math.pi / 180
DEG_90_AS_RAD = 90 * DEG_1_AS_RAD


class RadarFilter:

    def __init__(self, qfilter_enabled=True, queue_size=12, consecutive_min=7,
                    pexist_min=0.8, d_bpower_min=-10, phi_sdv_max=0.1, nan_threshold=0.5):
        self.qfilter_enabled = qfilter_enabled
        self.queue_size = queue_size
        self.consecutive_min = consecutive_min
        self.pexist_min = pexist_min
        self.d_bpower_min = d_bpower_min
        self.phi_sdv_max = phi_sdv_max
        self.nan_threshold = nan_threshold # maximum percent of queue that can be nan before it is automatically evaluated as an invalid target

        self.target_queues = {}


    def is_valid_target(self, target_id, target):
        if self.qfilter_enabled:
            self.make_target_queue_if_nonexistent(target_id)
            self.update_queues(target_id, target)

            if self.is_default_target(target):
                return False

            return self.queue_filter(target_id)

        # use passive filter
        if self.is_default_target(target):
            return False

        return self.passive_filter(target)


    def passive_filter(self, target):
        ''' Determines if the target is valid or noise based on simple value checks.
            Returns True if the target is valid.
        '''
        if target['consecutive'] < self.consecutive_min \
            or target['pexist'] < self.pexist_min \
            or target['dBpower'] <= self.d_bpower_min \
            or target['phiSdv'] >= self.phi_sdv_max:
            return False
        return True


    def queue_filter(self, target_id):
        ''' Determines if the target is valid or noise based on a given method.
            Returns True if the target is valid.
        '''
        if np.isnan(self.target_queues[target_id]['consecutive_queue']).sum() / self.queue_size > self.nan_threshold \
            or np.nanmean(self.target_queues[target_id]['consecutive_queue']) < self.consecutive_min \
            or np.nanmean(self.target_queues[target_id]['pexist_queue']) < self.pexist_min \
            or np.nanmean(self.target_queues[target_id]['d_bpower_queue']) <= self.d_bpower_min \
            or np.nanmean(self.target_queues[target_id]['phi_sdv_queue']) >= self.phi_sdv_max:
            return False
        return True


    def is_default_target(self, target):
        ''' Determines if there are measurments corresponding to the given target
            or if it is just a default message.
            Returns True if the target is a default message.
        '''
        if target['consecutive'] < 1:
            return True
        return False


    def update_queues(self, target_id, target):
        if self.is_default_target(target):
            self.target_queues[target_id]['consecutive_queue'].append(np.nan)
            self.target_queues[target_id]['pexist_queue'].append(np.nan)
            self.target_queues[target_id]['d_bpower_queue'].append(np.nan)
            self.target_queues[target_id]['phi_sdv_queue'].append(np.nan)
        else:
            self.target_queues[target_id]['consecutive_queue'].append(target['consecutive'])
            self.target_queues[target_id]['pexist_queue'].append(target['pexist'])
            self.target_queues[target_id]['d_bpower_queue'].append(target['dBpower'])
            self.target_queues[target_id]['phi_sdv_queue'].append(target['phiSdv'])


    def make_target_queue_if_nonexistent(self, target_id):
        if target_id not in self.target_queues:
            self.target_queues[target_id] = {}
            self.target_queues[target_id]['consecutive_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['pexist_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['d_bpower_queue'] = deque(maxlen=self.queue_size)
            self.target_queues[target_id]['phi_sdv_queue'] = deque(maxlen=self.queue_size)


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

        config = self.load_config()
        collector_output_file = config['collector_output_file']
        extract_directory = config['extract_directory']
        collector_output_file = Path(collector_output_file)
        print("Using:collector_output_file:", collector_output_file)
        extract_directory = Path(extract_directory)
        print("Using:extract_directory:", extract_directory)

        if not collector_output_file.is_file():
            print('collector output file does not exit')
        if not extract_directory.is_dir():
            extract_directory.mkdir(parents=True)

        # if there are no txt files in the directory, the tar needs to be unpacked
        if not list(extract_directory.glob('*.txt')):
            shutil.unpack_archive(str(collector_output_file), str(extract_directory))

        self.perception_instances = sorted(extract_directory.glob('*.txt'))

        self.radar_filter = RadarFilter()


    def load_config(self):
        configfile = 'scenarios/collector-scenario-config.yaml'

        with open(configfile, 'r') as f:
            config = yaml.safe_load(f)

        return config


    def get_metadata(self):
        if not self._metadata:
            builder = xviz.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz.CATEGORY.POSE)
            builder.stream("/radar_targets")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/tracking_targets")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/camera_targets")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)

            builder.stream("/measuring_circles")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({
                    'stroked': True,
                    'stroke_width': 1,
                    'stroke_color': [0, 255, 0, 128],
                    #'stroke_width_min_pixels': 10
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
            self._draw_measuring_circles(builder, timestamp)
            self._draw_perception_outputs(builder, timestamp)
            data = builder.get_message()

            return {
                'type': 'xviz/state_update',
                'data': data.to_object()
            }
        except Exception as e:
            print("Crashed in get_message:", e)


    def _draw_measuring_circles(self, builder: xviz.XVIZBuilder, timestamp):

        builder.primitive('/measuring_circles_lbl').text("30").position([30, 0, 0]).id('30lb')
        builder.primitive('/measuring_circles_lbl').text("25").position([25, 0, 0]).id('25lb')
        builder.primitive('/measuring_circles_lbl').text("20").position([20, 0, 0]).id('20lb')
        builder.primitive('/measuring_circles_lbl').text("15").position([15, 0, 0]).id('15lb')
        builder.primitive('/measuring_circles_lbl').text("10").position([10, 0, 0]).id('10lb')
        builder.primitive('/measuring_circles_lbl').text("5").position([5, 0, 0]).id('5lb')

        builder.primitive('/measuring_circles').circle([0, 0, 0], 30).id('30')
        builder.primitive('/measuring_circles').circle([0, 0, 0], 25).id('25')
        builder.primitive('/measuring_circles').circle([0, 0, 0], 20).id('20')
        builder.primitive('/measuring_circles').circle([0, 0, 0], 15).id('15')
        builder.primitive('/measuring_circles').circle([0, 0, 0], 10).id('10')
        builder.primitive('/measuring_circles').circle([0, 0, 0], 5).id('5')


    def _draw_perception_outputs(self, builder: xviz.XVIZBuilder, timestamp):
        try:
            builder.pose()\
                .timestamp(timestamp)

            if self.index == len(self.perception_instances):
                self.index = 0

            perception_instance = self.perception_instances[self.index]

            collector_proto_msg = self.deserialize_collector_proto_msg(perception_instance)
            camera_output, radar_output, tracking_output = self.extract_proto_msgs(collector_proto_msg)
            img = self.extract_image(collector_proto_msg.frame)

            if radar_output:
                self._draw_radar_targets(radar_output, builder)
            if tracking_output:
                self._draw_tracking_targets(tracking_output, builder)
            if camera_output:
                self._draw_camera_targets(camera_output, builder)
                img = self.postprocess(img, camera_output)

            self.show_image(img)

            self.index += 1

        except Exception as e:
            print('Crashed in draw perception outputs:', e)


    def _draw_radar_targets(self, radar_output, builder: xviz.XVIZBuilder):
        try:
            for target_id, target in radar_output['targets'].items():
                if 'dr' in target:
                    (x, y, z) = self.get_object_xyz(target, 'phi', 'dr', radar_ob=True)
                    if 'targetId' not in target:
                        target['targetId'] = target_id
                    if self.radar_filter.is_valid_target(target['targetId'], target):
                        fill_color = [255, 255, 0] # Yellow
                    else:
                        fill_color = [255, 0, 0] # Red

                    builder.primitive('/radar_targets').circle([x, y, z], .5)\
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
                        (x, y, z) = self.get_object_xyz(track, 'angle', 'distance')
                        fill_color = [0, 255, 0] # Green

                        builder.primitive('/tracking_targets').circle([x, y, z], .5)\
                            .style({'fill_color': fill_color})\
                            .id(track['trackId'])

        except Exception as e:
            print('Crashed in draw tracking targets:', e)


    def _draw_camera_targets(self, camera_output, builder: xviz.XVIZBuilder):
        try:
            for target in camera_output['targets']:
                (x, y, z) = self.get_object_xyz(target, 'objectAngle', 'objectDistance')
                fill_color = [0, 0, 255] # Blue

                builder.primitive('/camera_targets').circle([x, y, z], .5)\
                        .style({'fill_color': fill_color})\
                        .id(target['label'])

        except Exception as e:
            print('Crashed in draw camera targets:', e)


    def get_object_xyz(self, ob, angle_key, dist_key, radar_ob=False):
        x = math.cos(ob[angle_key]) * ob[dist_key]
        y = math.sin(ob[angle_key]) * ob[dist_key]
        z = .1

        if radar_ob:
            radar_offset_inline = 3.21213 # meters
            x += radar_offset_inline

        return (x, y, z)


    def deserialize_collector_proto_msg(self, file_path):
        collector_proto_msg = collector_pb2.CollectorOutput()
        collector_proto_msg.ParseFromString(Path(file_path).read_bytes())
        return collector_proto_msg


    def extract_image(self, img_bytes):
        encoded_img = np.frombuffer(img_bytes, dtype=np.uint8) # decode bytes
        decimg = cv2.imdecode(encoded_img, 1) # uncompress image
        return decimg


    def extract_proto_msgs(self, collector_proto_msg):
        camera_output = camera_pb2.CameraOutput()
        camera_output.ParseFromString(collector_proto_msg.camera_output)
        camera_output = MessageToDict(camera_output, including_default_value_fields=True)

        radar_output = radar_pb2.RadarOutput()
        radar_output.ParseFromString(collector_proto_msg.radar_output)
        radar_output = MessageToDict(radar_output, including_default_value_fields=True)

        tracking_output = falconeye_pb2.TrackingOutput()
        tracking_output.ParseFromString(collector_proto_msg.tracking_output)
        tracking_output = MessageToDict(tracking_output, including_default_value_fields=True)

        return camera_output, radar_output, tracking_output


    def show_image(self, image):
        image = cv2.resize(image, (0, 0), fx=.7, fy=.7)
        cv2.imshow('', image)
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

            '''
            cv2.rectangle(image, (tl['x'], tl['y']), (br['x'], br['y']),
                        self.colors.get(label, (0, 0, 0)), thickness)
            cv2.putText(image, conf, text_origin, fontFace,
                        fontScale, self.colors.get(label, (0, 0, 0)), 2)
            '''
            box_color = (241, 240, 236)
            cv2.rectangle(image, (tl['x'], tl['y']), (br['x'], br['y']),
                        box_color, thickness)
            cv2.putText(image, conf, text_origin, fontFace,
                        fontScale, box_color, 2)

        return image