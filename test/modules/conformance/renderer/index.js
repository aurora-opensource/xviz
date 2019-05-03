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

import {XVIZStyleParser} from '@xviz/parser';

import {parseFrame, getTransform} from './utils';

import renderCircle from './circle';
import renderPoint from './point';
import renderPolyline from './polyline';
import renderPolygon from './polygon';
import renderText from './text';
import renderStadium from './stadium';

// mapping from primitive_type to render function
const renderers = {
  circle: renderCircle,
  point: renderPoint,
  polyline: renderPolyline,
  polygon: renderPolygon,
  text: renderText,
  stadium: renderStadium
};

export default function renderXVIZ(context, frames) {
  const metadata = parseFrame(frames[0]);
  const timeslice = parseFrame(frames[1]);
  const styleParser = new XVIZStyleParser(metadata.styles);
  const {width, height} = context.canvas;

  for (const streamName in metadata.streams) {
    const streamMetadata = metadata.streams[streamName];
    const stream = timeslice.streams[streamName];
    if (!stream) {
      continue; // eslint-disable-line
    }

    const renderer = renderers[streamMetadata.primitive_type];
    const project = getTransform({
      vehiclePose: timeslice.vehiclePose,
      streamMetadata,
      viewport: {width, height}
    });
    const stylesheet = styleParser.getStylesheet(streamName);

    if (renderer) {
      if (stream.features) {
        stream.features.forEach(feature => renderer({context, feature, stylesheet, project}));
      }
    }
  }
}
