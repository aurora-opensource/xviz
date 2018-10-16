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
  time_series: 'time_series',
  primitive: 'primitive',
  variable: 'variable',
  pose: 'pose'
};

export const VARIABLE_TYPES = {
  float: 'float',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean'
};

export const PRIMITIVE_TYPES = {
  circle: 'circle',
  image: 'image',
  point: 'point',
  polygon: 'polygon',
  polyline: 'polyline',
  stadium: 'stadium',
  text: 'text'
};

export const STYLES = {
  strokeColor: 'strokeColor',
  fillColor: 'fillColor',
  radius: 'radius',
  radiusMinPixels: 'radiusMinPixels',
  radiusMaxPixels: 'radiusMaxPixels',
  strokeWidth: 'strokeWidth',
  strokeWidthMinPixels: 'strokeWidthMinPixels',
  strokeWidthMaxPixels: 'strokeWidthMaxPixels',
  height: 'height',
  opacity: 'opacity',
  stroked: 'stroked',
  filled: 'filled',
  extruded: 'extruded',
  wireframe: 'wireframe',
  size: 'size',
  color: 'color',
  angle: 'angle',
  position: 'position'
};

export const PRIMITIVE_STYLE_MAP = {
  [PRIMITIVE_TYPES.circle]: [
    STYLES.strokeColor,
    STYLES.fillColor,
    STYLES.radius,
    STYLES.radiusMinPixels,
    STYLES.radiusMaxPixels
  ],
  [PRIMITIVE_TYPES.point]: [
    STYLES.fillColor,
    STYLES.radius,
    STYLES.radiusMinPixels,
    STYLES.radiusMaxPixels
  ],
  [PRIMITIVE_TYPES.polygon]: [
    STYLES.strokeColor,
    STYLES.fillColor,
    STYLES.strokeWidth,
    STYLES.strokeWidthMinPixels,
    STYLES.strokeWidthMaxPixels,
    STYLES.height,
    STYLES.opacity,
    STYLES.stroked,
    STYLES.filled,
    STYLES.extruded,
    STYLES.wireframe
  ],
  // TODO need verify from here
  [PRIMITIVE_TYPES.text]: [STYLES.size, STYLES.position, STYLES.angle, STYLES.color],
  [PRIMITIVE_TYPES.polyline]: [
    STYLES.strokeColor,
    STYLES.strokeWidth,
    STYLES.strokeWidthMinPixels,
    STYLES.strokeWidthMaxPixels
  ],
  [PRIMITIVE_TYPES.stadium]: [
    STYLES.strokeColor,
    STYLES.fillColor,
    STYLES.strokeWidth,
    STYLES.strokeWidthMinPixels,
    STYLES.strokeWidthMaxPixels
  ]
};

export const PRIMARY_POSE_STREAM = '/vehicle-pose';
