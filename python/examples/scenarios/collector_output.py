"""
This module provides a example scenario where a vehicle drives along a circle.
"""

import math
import time
import json
import os
import shutil
import cv2
import numpy as np
from pathlib import Path

import xviz
import xviz.builder as xbuilder

def prepare_parent_import(N):
    import sys
    # N = number of parent directories up that you want to import from, cwd of file would be N=0
    top_dir = Path(__file__).resolve().parents[N]
    sys.path.append(str(top_dir / 'Proto-Files'))

prepare_parent_import(3)
from protobuf_APIs import collector_pb2, falconeye_pb2, radar_pb2, camera_pb2


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

        tar_file = '/home/raven.ravenind.net/r103943/Desktop/collector/v2020-25-0-25ed12058f204e60ab6bf655e1d95640-nodetection-primary-forward-57-smartag-autocart-1596479215515-3668.tar'
        extract_dir = '/home/raven.ravenind.net/r103943/Desktop/collector/extracted'





    def get_metadata(self):
        if not self._metadata:
            builder = xviz.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz.CATEGORY.POSE)
            builder.stream("/radar_targets")\
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

    def get_track_xyz(self, track, dist_key, angle_key):
        x = math.cos(track[angle_key]) * track[dist_key]
        y = math.sin(track[angle_key]) * track[dist_key]
        z = .1

        return (x,y,z)

    def get_message(self, time_offset):
        try:
            timestamp = self._timestamp + time_offset

            builder = xviz.XVIZBuilder(metadata=self._metadata)
            self._draw_measuring_circles(builder, timestamp)
            self._draw_tracks(builder, timestamp)
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

    def _draw_tracks(self, builder: xviz.XVIZBuilder, timestamp):
        try:
            print("Drawing tracks")
            builder.pose()\
                .timestamp(timestamp)

            if self.index >= len(self.data):
                self.index = 0

            cntr = 0.0 # increases the size of bubble with every target

            confidence = 'pexist', .1
            hits = 'consecutive', 1
            the_id = 'target_id'
            dist_key = 'dr'
            angle_key = 'phi'

            print("len targets:", len(self.data[self.index]["targets"]))
            print("len data[index]:", len(self.data[self.index]))

            for tgt in self.data[self.index]["targets"]:
                
                #print("tgt", tgt)
                print("index", self.index)
                # skip target which do not meet min confidence
                if len(confidence) != 0:
                    if tgt[confidence[0]] < confidence[1]:
                        continue
                    else:
                        score = tgt[confidence[0]]
                # skip target which do not meet min confidence
                if len(hits) != 0:
                    if tgt[hits[0]] < hits[1]:
                        continue
                    else:
                        hit_streak = tgt[hits[0]]

                print(" | ", end="")
                print ('score: ', score, end="")
                print(" | ", end="")
                print ('hit_streak: ', hit_streak, end="")
                print("\n")

                (x,y,z) = self.get_track_xyz(tgt, dist_key=dist_key, angle_key=angle_key)
                print("using (x,y,z):", (x,y,z))

                if tgt[the_id] in self.id_tracks:
                    int_id = self.id_tracks[tgt[the_id]]
                else:
                    int_id = self.id_last
                    self.id_tracks[tgt[the_id]] = int_id
                    self.id_last += 1
                
                #Blue
                fill_color = [0, 0, 255]

                builder.primitive('/radar_targets').circle([x, y, z], .5)\
                    .style({'fill_color': fill_color})\
                    .id(str(tgt[the_id]))

            self.index += 1
        except Exception as e:
            print("Crashed in draw tracks:", e)


    def unpack_tar(self, tar_file, destination_direc):
        if not destination_direc.is_dir():
            destination_direc.mkdir(parents=True)
        shutil.unpack_archive(str(tar_file), str(destination_direc))

    
    def visualize_collector_output(self):
        for serialized_perception_file in sorted(self.extract_directory.glob('*.txt')):
            collector_output = self.extract_collector_output(serialized_perception_file)
            img = self.extract_image(collector_output.frame)
            camera_output, radar_output, tracking_output = self.extract_proto_msgs(collector_output)
            if len(radar_output.targets) > 0:
                print(radar_output.targets[1])
            # radar_output = MessageToDict(radar_output)
            # if radar_output:
            #     print(radar_output['targets'])


    def extract_collector_output(self, file_path):
        collector_output = collector_pb2.CollectorOutput()
        collector_output.ParseFromString(Path(file_path).read_bytes())
        return collector_output


    def extract_image(self, img_bytes):
        encoded_img = np.frombuffer(img_bytes, dtype=np.uint8) # decode bytes
        decimg = cv2.imdecode(encoded_img, 1) # uncompress image
        return decimg

    
    def extract_proto_msgs(self, collector_output):
        camera_output = camera_pb2.CameraOutput()
        camera_output.ParseFromString(collector_output.camera_output)

        radar_output = radar_pb2.RadarOutput()
        radar_output.ParseFromString(collector_output.radar_output)

        tracking_output = falconeye_pb2.TrackingOutput()
        tracking_output.ParseFromString(collector_output.tracking_output)

        return camera_output, radar_output, tracking_output


    def show_image(self, img):
        cv2.imshow('', img)
        cv2.waitKey(33)