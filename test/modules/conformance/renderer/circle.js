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

import {getStyles, getCSSColor} from './utils';

const STREAM_STYLES = [
  'opacity',
  'radius_min_pixels',
  'radius_max_pixels',
  'stroked',
  'filled',
  'stroke_width_min_pixels',
  'stroke_width_max_pixels'
];

const OBJECT_STYLES = ['radius', 'stroke_width', 'stroke_color', 'fill_color'];

export default function renderCircle({context, feature, stylesheet, project}) {
  const streamStyles = getStyles(stylesheet, STREAM_STYLES, {});
  const objectStyles = getStyles(stylesheet, OBJECT_STYLES, feature);

  // Resolve styles
  const center = feature.center;
  let radius = project(feature.radius || objectStyles.radius);
  radius = Math.min(
    Math.max(streamStyles.radius_min_pixels, radius),
    streamStyles.radius_max_pixels
  );
  let strokeWidth = project(objectStyles.stroke_width);
  strokeWidth = Math.min(
    Math.max(streamStyles.stroke_width_min_pixels, strokeWidth),
    streamStyles.stroke_width_max_pixels
  );
  const strokeColor = getCSSColor(objectStyles.stroke_color, streamStyles.opacity);
  const fillColor = getCSSColor(objectStyles.fill_color, streamStyles.opacity);

  // Render to canvas
  context.beginPath();
  context.arc(project(center)[0], project(center)[1], radius, 0, Math.PI * 2);
  context.closePath();

  if (streamStyles.filled) {
    context.fillStyle = fillColor;
    context.fill();
  }
  if (streamStyles.stroked) {
    context.lineWidth = strokeWidth;
    context.strokeStyle = strokeColor;
    context.stroke();
  }
}
