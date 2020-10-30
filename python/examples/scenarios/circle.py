"""
This module provides a example scenario where a vehicle drives along a circle.
"""

import math
import time
import json

import xviz_avs
import xviz_avs.builder as xbuilder

DEG_1_AS_RAD = math.pi / 180
DEG_90_AS_RAD = 90 * DEG_1_AS_RAD

class CircleScenario:
    def __init__(self, live=True, radius=30, duration=10, speed=10):
        self._timestamp = time.time()
        self._radius = radius
        self._duration = duration
        self._speed = speed
        self._live = live
        self._metadata = None

    def get_metadata(self):
        if not self._metadata:
            builder = xviz_avs.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz_avs.CATEGORY.POSE)
            builder.stream("/circle")\
                .coordinate(xviz_avs.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz_avs.CATEGORY.PRIMITIVE)\
                .type(xviz_avs.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/ground_grid_h")\
                .coordinate(xviz_avs.COORDINATE_TYPES.IDENTITY)\
                .category(xviz_avs.CATEGORY.PRIMITIVE)\
                .type(xviz_avs.PRIMITIVE_TYPES.POLYLINE)\
                .stream_style({
                    'stroked': True,
                    'stroke_width': 0.2,
                    'stroke_color': [0, 255, 0, 128]
                })
            builder.stream("/ground_grid_v")\
                .coordinate(xviz_avs.COORDINATE_TYPES.IDENTITY)\
                .category(xviz_avs.CATEGORY.PRIMITIVE)\
                .type(xviz_avs.PRIMITIVE_TYPES.POLYLINE)\
                .stream_style({
                    'stroked': True,
                    'stroke_width': 0.2,
                    'stroke_color': [0, 255, 0, 128]
                })
            builder.stream("/points")\
                .coordinate(xviz_avs.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz_avs.CATEGORY.PRIMITIVE)\
                .type(xviz_avs.PRIMITIVE_TYPES.POINT)\
                .stream_style({
                    'radius_pixels': 6
                })
            builder.stream("/object")\
                .coordinate(xviz_avs.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .stream_style({
                    'extruded': True,
                    'fill_color': [0, 200, 70, 128],
                })\
                .style_class('Unknown', {
                    'fill_color': [200, 200, 0, 128],
                    'stroke_color': [255, 0, 0, 128],
                })\
                .category(xviz_avs.CATEGORY.PRIMITIVE)\
                .type(xviz_avs.PRIMITIVE_TYPES.POLYGON)
            if not self._live:
                log_start_time = self._timestamp
                builder.start_time(log_start_time)\
                    .end_time(log_start_time + self._duration)
            self._metadata = builder.get_message()

        if self._live:
            return {
                'type': 'xviz/metadata',
                'data': self._metadata.to_object()
            }
        else:
            return self._metadata

    def get_message(self, time_offset):
        timestamp = self._timestamp + time_offset

        builder = xviz_avs.XVIZBuilder(metadata=self._metadata)
        self._draw_pose(builder, timestamp)
        self._draw_grid(builder)
        data = builder.get_message()

        if self._live:
            return {
                'type': 'xviz/state_update',
                'data': data.to_object()
            }
        else:
            return data

    def _draw_pose(self, builder, timestamp):
        circumference = math.pi * self._radius * 2
        degrees_persec = 360 / (circumference / self._speed)
        current_degrees = timestamp * degrees_persec
        angle = current_degrees * DEG_1_AS_RAD

        builder.pose()\
            .timestamp(timestamp)\
            .orientation(0, 0, DEG_90_AS_RAD + current_degrees * DEG_1_AS_RAD)\
            .position(self._radius * math.cos(angle), self._radius * math.sin(angle), 0)

    def _calculate_grid(self, size):
        grid = [0]
        for i in range(10, size, 10):
            grid = [-i] + grid + [i]
        return grid

    def _draw_grid(self, builder: xviz_avs.XVIZBuilder):
        # Have grid extend beyond car path
        grid_size = self._radius + 10
        grid = self._calculate_grid(grid_size)

        for x in grid:
            builder.primitive('/ground_grid_h').polyline([x, -grid_size, 0, x, grid_size, 0])
            builder.primitive('/ground_grid_v').polyline([-grid_size, x, 0, grid_size, x, 0])
        builder.primitive('/circle').circle([0.0, 0.0, 0.0], self._radius)
        builder.primitive('/circle').circle([self._radius, 0.0, 0.1], 1)\
            .style({'fill_color': [0, 0, 255, 128]})
        builder.primitive('/points').points([3, 0, 0, 0, 3, 0, 0, 0, 3])\
            .colors([200,40,80,128,80,40,200,128,80,200,40,128])\
            .id("indicator")
        builder.primitive('/object').polygon([
            5, 5, 5,
            10, 5, 5,
            10, 10, 5,
            5, 10, 5,
            5, 5, 5,
        ]).classes(['Unknown'])\
            .style({'height': 2})\
            .id('object1')
