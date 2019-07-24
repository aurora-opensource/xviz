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
import {XVIZBuilder, XVIZMetadataBuilder, XVIZUIBuilder} from '@xviz/builder';

// Creates a panel, container, metric, plot, and video
function generateTestUI(uiBuilder) {
  const panel = uiBuilder.panel({
    name: 'Metrics'
  });

  const container = uiBuilder.container({
    name: 'Metrics Panel',
    layout: 'vertical',
    interactions: ['REORDERABLE', 'DRAG_OUT']
  });
  panel.child(container);

  const metricAcceleration = uiBuilder.metric({
    title: 'Acceleration',
    streams: ['/vehicle/acceleration'],
    description: 'The acceleration of the vehicle'
  });
  container.child(metricAcceleration);

  const plot = uiBuilder.plot({
    title: 'Cost',
    description: 'Costs considered in planning the vehicle trajectory',
    independentVariable: '/motion_planning/time',
    dependentVariables: [
      '/motion_planning/trajectory/cost/cost1',
      '/motion_planning/trajectory/cost/cost2',
      '/motion_planning/trajectory/cost/cost3'
    ]
  });
  container.child(plot);

  const video = uiBuilder.video({
    cameras: ['/camera/image_00', '/camera/image_01', '/camera/image_02', '/camera/image_03']
  });
  container.child(video);

  return panel;
}

export function generateTestData(xvizWriter) {
  const uiBuilder = new XVIZUIBuilder();
  uiBuilder.child(generateTestUI(uiBuilder));

  const metaBuilder = new XVIZMetadataBuilder();
  metaBuilder.ui(uiBuilder);
  metaBuilder.startTime(1000.1);
  metaBuilder.endTime(1005.3);
  metaBuilder
    .stream('/vehicle_pose')
    .category('pose')

    .stream('/vehicle/acceleration')
    .category('time_series')
    .type('float')
    .unit('m/s^2')

    .stream('/objects')
    .category('primitive')
    .type('polygon')
    .streamStyle({
      stroke_color: '#AABBCC',
      stroke_width: 1.4
    });

  xvizWriter.writeMetadata(metaBuilder.getMetadata());

  const builder = new XVIZBuilder();
  builder
    .pose('/vehicle_pose')
    .timestamp(1000.1)
    .mapOrigin(0, 0, 0);

  builder
    .timeSeries('/vehicle/acceleration')
    .timestamp(1000.1)
    .value(10.7);

  builder.primitive('/objects').polygon([1, 1, 1, 3, 3, 3, 4, 4, 4]);

  xvizWriter.writeMessage(0, builder.getMessage());
}
