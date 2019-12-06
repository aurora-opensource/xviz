"""
This module provides a example scenario where a vehicle drives along a circle.
"""

import math
import time
import json

import xviz
import xviz.builder as xbuilder

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
            builder = xviz.XVIZMetadataBuilder()
            builder.stream("/vehicle_pose").category(xviz.CATEGORY.POSE)
            builder.stream("/circle")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .stream_style({'fill_color': [200, 0, 70, 128]})\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.CIRCLE)
            builder.stream("/ground_grid_h")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)\
                .stream_style({
                    'stroked': True,
                    'stroke_width': 0.2,
                    'stroke_color': [0, 255, 0, 128]
                })
            builder.stream("/ground_grid_v")\
                .coordinate(xviz.COORDINATE_TYPES.IDENTITY)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POLYLINE)\
                .stream_style({
                    'stroked': True,
                    'stroke_width': 0.2,
                    'stroke_color': [0, 255, 0, 128]
                })
            builder.stream("/points")\
                .coordinate(xviz.COORDINATE_TYPES.VEHICLE_RELATIVE)\
                .category(xviz.CATEGORY.PRIMITIVE)\
                .type(xviz.PRIMITIVE_TYPES.POINT)\
                .stream_style({
                    'radius_pixels': 6
                })
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
        timestamp = self._timestamp + time_offset

        builder = xviz.XVIZBuilder(metadata=self._metadata)
        self._draw_pose(builder, timestamp)
        self._draw_grid(builder)
        data = builder.get_message()

        return {
            'type': 'xviz/state_update',
            'data': data.to_object()
        }

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

    def _draw_grid(self, builder: xviz.XVIZBuilder):
        # Have grid extend beyond car path
        grid_size = self._radius + 10
        grid = self._calculate_grid(grid_size)

        for x in grid:
            builder.primitive('/ground_grid_h').polyline([x, -grid_size, 0, x, grid_size, 0])
            builder.primitive('/ground_grid_v').polyline([-grid_size, x, 0, grid_size, x, 0])
        builder.primitive('/circle').circle([0.0, 0.0, 0.0], self._radius)
        builder.primitive('/circle').circle([self._radius, 0.0, 0.1], 1)\
            .style({'fill_color': [0, 0, 255]})
        builder.primitive('/points').points([3, 0, 0, 0, 3, 0, 0, 0, 3])\
            .colors([200,40,80,80,40,200,80,200,40])\
            .id("indicator")
