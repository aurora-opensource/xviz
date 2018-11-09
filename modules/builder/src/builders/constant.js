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
  annotation: 'annotation',
  future_instance: 'future_instance',
  pose: 'pose',
  primitive: 'primitive',
  ui_primitive: 'ui_primitive',
  time_series: 'time_series',
  variable: 'variable'
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
  wireframe: 'wireframe',
  size: 'size',
  color: 'color',
  angle: 'angle',
  text_anchor: 'text_anchor',
  alignment_baseline: 'alignment_baseline'
};

export const PRIMITIVE_STYLE_MAP = {
  [PRIMITIVE_TYPES.circle]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels
  ],
  [PRIMITIVE_TYPES.point]: [
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels
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
    STYLES.extruded,
    STYLES.wireframe
  ],
  // TODO need verify from here
  [PRIMITIVE_TYPES.text]: [
    STYLES.size,
    STYLES.angle,
    STYLES.text_anchor,
    STYLES.alignment_baseline,
    STYLES.color
  ],
  [PRIMITIVE_TYPES.polyline]: [
    STYLES.stroke_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ],
  [PRIMITIVE_TYPES.stadium]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ]
};

export const PRIMARY_POSE_STREAM = '/vehicle_pose';
