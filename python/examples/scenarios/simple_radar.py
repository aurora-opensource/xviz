"""
This module provides a example scenario where a vehicle drives along a circle.
"""

import math
import time
import json
import os

import xviz
import xviz.builder as xbuilder

DEG_1_AS_RAD = math.pi / 180
DEG_90_AS_RAD = 90 * DEG_1_AS_RAD

class SimpleRadarScenario:
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

        SIMPLE_FILE_NAME = './data/radar_output-20_0.txt.json'
        dir_path = os.path.dirname(os.path.realpath(__file__))
        full_file_path = os.path.join(dir_path, SIMPLE_FILE_NAME)
        with open(full_file_path, "r") as f:
            self.data = json.load(f)

        #print("self.data", self.data)

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

