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

const CIRCLE_STYLES = [
  'opacity',
  'radius_min_pixels',
  'radius_max_pixels',
  'radius',
  'stroked',
  'filled',
  'stroke_width_min_pixels',
  'stroke_width_max_pixels',
  'stroke_width',
  'stroke_color',
  'fill_color'
];

export default function renderCircle({context, feature, stylesheet, project}) {
  const styles = getStyles(stylesheet, CIRCLE_STYLES, feature);

  // Resolve styles
  const center = project(feature.center);
  const radius = Math.min(
    Math.max(styles.radius_min_pixels, styles.radius),
    styles.radius_max_pixels
  );
  const strokeWidth = Math.min(
    Math.max(styles.stroke_width_min_pixels, styles.stroke_width),
    styles.stroke_width_max_pixels
  );
  const strokeColor = getCSSColor(styles.stroke_color, styles.opacity);
  const fillColor = getCSSColor(styles.fill_color, styles.opacity);

  // Render to canvas
  context.beginPath();
  context.arc(center[0], center[1], radius, 0, Math.PI * 2);
  context.closePath();

  if (styles.stroked) {
    context.lineWidth = strokeWidth;
    context.strokeStyle = strokeColor;
    context.stroke();
  }
  if (styles.filled) {
    context.fillStyle = fillColor;
    context.fill();
  }
}
