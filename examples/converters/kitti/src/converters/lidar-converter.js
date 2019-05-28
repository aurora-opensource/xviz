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
import uuid from 'uuid/v4';

import BaseConverter from './base-converter';
import {loadLidarData} from '../parsers/parse-lidar-points';

// load file
export default class LidarConverter extends BaseConverter {
  constructor(rootDir, streamDir, {disabledStreams = []} = {}) {
    super(rootDir, streamDir);

    this.LIDAR_POINTS = '/lidar/points';

    this.disabled = disabledStreams
      .map(pattern => RegExp(pattern).test(this.LIDAR_POINTS))
      .some(x => x === true);
  }

  async convertMessage(messageNumber, xvizBuilder) {
    if (this.disabled) {
      return;
    }

    const {data} = await this.loadMessage(messageNumber);
    const lidarData = loadLidarData(data);

    xvizBuilder
      .primitive(this.LIDAR_POINTS)
      .points(lidarData.positions)
      .colors(lidarData.colors)
      .id(uuid());
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.LIDAR_POINTS)
      .category('primitive')
      .type('point')
      .streamStyle({
        fill_color: '#00a',
        radius_pixels: 1
      })
      // laser scanner relative to GPS position
      // http://www.cvlibs.net/datasets/kitti/setup.php
      .coordinate('VEHICLE_RELATIVE')
      .pose({
        x: 0.81,
        y: -0.32,
        z: 1.73
      });
  }
}
