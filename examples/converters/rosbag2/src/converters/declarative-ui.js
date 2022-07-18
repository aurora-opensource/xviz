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

import {XVIZUIBuilder} from '@xviz/builder';

export function getDeclarativeUI({fakeStreams}) {
  const builder = new XVIZUIBuilder({});

  builder.child(getMetricsPanel(builder));
  builder.child(getVideoPanel(builder));

  if (fakeStreams) {
    builder.child(getPlotPanel(builder));
    builder.child(getTablePanel(builder));
  }

  return builder;
}

function getMetricsPanel(builder) {
  const panel = builder.panel({
    name: 'Metrics'
  });

  const container = builder.container({
    name: 'Metrics Panel',
    layout: 'vertical'
  });

  const metricAcceleration = builder.metric({
    title: 'Acceleration',
    streams: ['/vehicle/acceleration'],
    description: 'The acceleration of the vehicle'
  });

  const metricVelocity = builder.metric({
    title: 'Velocity',
    streams: ['/vehicle/velocity'],
    description: 'The velocity of the vehicle'
  });

  const metricWheel = builder.metric({
    title: 'Wheel',
    streams: ['/vehicle/wheel_angle'],
    description: 'The angular rate of the vehicle'
  });

  container.child(metricAcceleration);
  container.child(metricVelocity);
  container.child(metricWheel);
  panel.child(container);

  return panel;
}

function getPlotPanel(builder) {
  const panel = builder.panel({
    name: 'Planning'
  });

  const plot = builder.plot({
    title: 'Cost',
    description: 'Costs considered in planning the vehicle trajectory',
    independentVariable: '/motion_planning/time',
    dependentVariables: [
      '/motion_planning/trajectory/cost/cost1',
      '/motion_planning/trajectory/cost/cost2',
      '/motion_planning/trajectory/cost/cost3'
    ]
  });

  panel.child(plot);

  return panel;
}

function getVideoPanel(builder) {
  const panel = builder.panel({
    name: 'Camera'
  });

  const video = builder.video({
    cameras: ['/camera/image_00', '/camera/image_01', '/camera/image_02', '/camera/image_03']
  });

  panel.child(video);

  return panel;
}

function getTablePanel(builder) {
  const panel = builder.panel({
    name: 'Perception'
  });

  const table = builder.treetable({
    title: 'Perception',
    description: 'Objects identified by perception',
    stream: '/perception/objects/table',
    displayObjectId: true
  });

  panel.child(table);

  return panel;
}
