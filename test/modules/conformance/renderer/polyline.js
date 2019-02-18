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

const STREAM_STYLES = ['opacity', 'stroke_width_min_pixels', 'stroke_width_max_pixels'];

const OBJECT_STYLES = ['stroke_color', 'stroke_width'];

export default function renderPolyline({context, feature, stylesheet, project}) {
  const streamStyles = getStyles(stylesheet, STREAM_STYLES, {});
  const objectStyles = getStyles(stylesheet, OBJECT_STYLES, feature);

  // Resolve styles
  const vertices = unflattenVertices(feature.vertices);
  let strokeWidth = project(objectStyles.stroke_width);
  strokeWidth = Math.min(
    Math.max(streamStyles.stroke_width_min_pixels, strokeWidth),
    streamStyles.stroke_width_max_pixels
  );
  const strokeColor = getCSSColor(objectStyles.stroke_color, streamStyles.opacity);

  // Render to canvas
  context.beginPath();
  for (let i = 0; i < vertices.length; i++) {
    const p = project(vertices[i]);
    if (i === 0) {
      context.moveTo(p[0], p[1]);
    } else {
      context.lineTo(p[0], p[1]);
    }
  }
  if (isPathClosed(vertices)) {
    context.closePath();
  }

  context.lineWidth = strokeWidth;
  context.strokeStyle = strokeColor;
  context.stroke();
}

function isPathClosed(vertices) {
  const firstVertex = vertices[0];
  const lastVertex = vertices[vertices.length - 1];

  return (
    firstVertex[0] === lastVertex[0] &&
    firstVertex[1] === lastVertex[1] &&
    firstVertex[2] === lastVertex[2]
  );
}
