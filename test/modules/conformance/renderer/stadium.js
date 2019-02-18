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

const STREAM_STYLES = ['opacity', 'radius_min_pixels', 'radius_max_pixels'];

const OBJECT_STYLES = ['fill_color', 'radius'];

export default function renderPolyline({context, feature, stylesheet, project}) {
  const streamStyles = getStyles(stylesheet, STREAM_STYLES, {});
  const objectStyles = getStyles(stylesheet, OBJECT_STYLES, feature);

  // Resolve styles
  const {start, end} = feature;
  let radius = project(feature.radius || objectStyles.radius);
  radius = Math.min(
    Math.max(streamStyles.radius_min_pixels, radius),
    streamStyles.radius_max_pixels
  );
  const fillColor = getCSSColor(objectStyles.fill_color, streamStyles.opacity);

  // Render to canvas
  context.beginPath();
  context.moveTo(project(start)[0], project(start)[1]);
  context.lineTo(project(end)[0], project(end)[1]);

  context.lineCap = 'round';
  context.lineWidth = radius;
  context.strokeStyle = fillColor;
  context.stroke();
}
