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

import {getStyles, getCSSColor, unflattenVertices} from './utils';
import Color from 'color';
import {Vector3, lerp, clamp} from 'math.gl';

const STREAM_STYLES = [
  'opacity',
  'radius_pixels',
  'fill_color',
  'point_color_mode',
  'point_color_domain'
];

export default function renderPoint({context, feature, stylesheet, project}) {
  const streamStyles = getStyles(stylesheet, STREAM_STYLES, {});

  // Resolve styles
  const vertices = unflattenVertices(feature.points);
  const colors = feature.colors && unflattenVertices(feature.colors, vertices.length);
  const colorMode = streamStyles.point_color_mode;
  const colorDomain = streamStyles.point_color_domain;
  const radiusPixels = streamStyles.radius_pixels;

  vertices.forEach((vertex, i) => {
    let color;

    switch (colorMode) {
      case 'ELEVATION':
        color = getColor(vertex[2], colorDomain);
        break;

      case 'DISTANCE_TO_VEHICLE':
        color = getColor(new Vector3(vertex[0], vertex[1], vertex[2]).len(), colorDomain);
        break;

      default:
        color = (colors && colors[i]) || streamStyles.fill_color;
    }
    color = getCSSColor(color, streamStyles.opacity);

    // Render to canvas
    context.beginPath();
    context.arc(project(vertex)[0], project(vertex)[1], radiusPixels, 0, Math.PI * 2);
    context.closePath();

    context.fillStyle = color;
    context.fill();
  });
}

function getColor(value, domain) {
  const h = lerp(180, 0, clamp((value - domain[0]) / (domain[1] - domain[0]), 0, 1));
  return Color.hsl(h, 100, 50)
    .rgb()
    .array();
}
