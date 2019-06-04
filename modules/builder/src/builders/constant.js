// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable camelcase */
export const CATEGORY = {
  // Deprecated lowercase beta enumeration values
  annotation: 'ANNOTATION',
  future_instance: 'FUTURE_INSTANCE',
  pose: 'POSE',
  primitive: 'PRIMITIVE',
  ui_primitive: 'UI_PRIMITIVE',
  time_series: 'TIME_SERIES',
  variable: 'VARIABLE',

  ANNOTATION: 'ANNOTATION',
  FUTURE_INSTANCE: 'FUTURE_INSTANCE',
  POSE: 'POSE',
  PRIMITIVE: 'PRIMITIVE',
  UI_PRIMITIVE: 'UI_PRIMITIVE',
  TIME_SERIES: 'TIME_SERIES',
  VARIABLE: 'VARIABLE'
};

export const PRIMITIVE_TYPES = {
  // Geometry primitives
  circle: 'circle',
  image: 'image',
  point: 'point',
  polygon: 'polygon',
  polyline: 'polyline',
  stadium: 'stadium',
  text: 'text',

  // UI primitives
  treetable: 'treetable'
};

export const STYLES = {
  stroke_color: 'stroke_color',
  fill_color: 'fill_color',
  radius: 'radius',
  radius_pixels: 'radius_pixels',
  radius_min_pixels: 'radius_min_pixels',
  radius_max_pixels: 'radius_max_pixels',
  stroke_width: 'stroke_width',
  stroke_width_min_pixels: 'stroke_width_min_pixels',
  stroke_width_max_pixels: 'stroke_width_max_pixels',
  height: 'height',
  opacity: 'opacity',
  stroked: 'stroked',
  filled: 'filled',
  extruded: 'extruded',
  font_family: 'font_family',
  font_weight: 'font_weight',
  text_size: 'text_size',
  text_rotation: 'text_rotation',
  text_anchor: 'text_anchor',
  text_baseline: 'text_baseline',
  point_color_mode: 'point_color_mode',
  point_color_domain: 'point_color_domain'
};

export const PRIMITIVE_STYLE_MAP = {
  [PRIMITIVE_TYPES.circle]: [
    STYLES.opacity,
    STYLES.stroked,
    STYLES.filled,
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ],
  [PRIMITIVE_TYPES.point]: [
    STYLES.opacity,
    STYLES.fill_color,
    STYLES.radius_pixels,
    STYLES.point_color_mode,
    STYLES.point_color_domain
  ],
  [PRIMITIVE_TYPES.polygon]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels,
    STYLES.height,
    STYLES.opacity,
    STYLES.stroked,
    STYLES.filled,
    STYLES.extruded
  ],
  // TODO need verify from here
  [PRIMITIVE_TYPES.text]: [
    STYLES.opacity,
    STYLES.font_family,
    STYLES.font_weight,
    STYLES.text_size,
    STYLES.text_rotation,
    STYLES.text_anchor,
    STYLES.text_baseline,
    STYLES.fill_color
  ],
  [PRIMITIVE_TYPES.polyline]: [
    STYLES.opacity,
    STYLES.stroke_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ],
  [PRIMITIVE_TYPES.stadium]: [
    STYLES.opacity,
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels
  ]
};

export const PRIMARY_POSE_STREAM = '/vehicle_pose';
