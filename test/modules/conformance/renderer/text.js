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

const STREAM_STYLES = ['opacity', 'font_family', 'font_weight'];

const OBJECT_STYLES = ['fill_color', 'text_size', 'text_angle', 'text_anchor', 'text_baseline'];

export default function renderText({context, feature, stylesheet, project}) {
  const streamStyles = getStyles(stylesheet, STREAM_STYLES, {});
  const objectStyles = getStyles(stylesheet, OBJECT_STYLES, feature);

  // Resolve styles
  const {position, text} = feature;
  const fontSize = objectStyles.text_size;
  const angle = objectStyles.text_angle;
  const fontFamily = streamStyles.font_family;
  const fontWeight = streamStyles.font_weight;
  const textAnchor = objectStyles.text_anchor;
  const textBaseline = objectStyles.text_baseline;
  const fillColor = getCSSColor(objectStyles.fill_color, streamStyles.opacity);

  // Render to canvas
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = textAnchor === 'middle' ? 'center' : textAnchor;
  context.textBaseline = textBaseline === 'center' ? 'middle' : textBaseline;
  context.fillStyle = fillColor;

  context.save();
  context.translate(project(position)[0], project(position)[1]);
  context.rotate((-angle * Math.PI) / 180);
  context.fillText(text, 0, 0);
  context.restore();
}
