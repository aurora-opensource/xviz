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
import {XVIZUIBuilder} from '@xviz/builder';
import {serverArgs} from '@xviz/server';
import {
  convertArgs,
  ROSBag,
  registerROSBagProvider,

  // Converters
  SensorImage,
  SensorNavSatFix,
  SensorPointCloud2
} from '@xviz/ros';

import {SensorImu} from './messages/imu-converter';

// We subclass from the ROSBag and override the `getMetadata`
// to add our own entries for UI elements.
export class KittiBag extends ROSBag {
  constructor(bagPath, rosConfig) {
    super(bagPath, rosConfig);
  }

  getMetadata(builder, ros2xviz) {
    super.getMetadata(builder, ros2xviz);

    const LEFT = '/kitti/camera_color_left/image_raw';
    const RIGHT = '/kitti/camera_color_right/image_raw';

    const ui = new XVIZUIBuilder({});

    const cam_panel = ui.panel({
      name: 'Camera'
    });

    const video = ui.video({
      cameras: [LEFT, RIGHT]
    });

    cam_panel.child(video);

    const chart_panel = ui.panel({
      name: 'Charts'
    });

    const metric = ui.metric({
      streams: ['/vehicle/acceleration'],
      title: 'Acceleration',
      description: 'The acceleration of the vehicle'
    });

    chart_panel.child(metric);

    ui.child(cam_panel);
    ui.child(chart_panel);

    builder.ui(ui);
  }
}

// Setup ROS Provider
function setupROSProvider(args) {
  if (args.rosConfig) {
    const converters = [SensorImage, SensorNavSatFix, SensorPointCloud2, SensorImu];

    registerROSBagProvider(args.rosConfig, {converters, BagClass: KittiBag});
  }
}

function main() {
  const yargs = require('yargs');

  let args = yargs.alias('h', 'help');

  args = convertArgs(args);
  args = serverArgs(args);

  // This will parse and execute the server command
  args.middleware(setupROSProvider).parse();
}

main();
