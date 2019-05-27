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
import path from 'path';
import assert from 'assert';
import fs from 'fs';

import {toArrayBuffer, parseBinary, toMap, quaternionToEulerAngle} from '../common';

export default class LidarConverter {
  constructor(rootDir, streamDir) {
    this.rootDir = rootDir;
    this.streamDir = streamDir;

    this.LIDAR_POINTS = '/lidar/points';
  }

  load({frames}) {
    this.frames = frames;

    this.pointCloudFilePathByToken = toMap(frames, 'token', frame => {
      const substrings = frame.sensors.LIDAR_TOP.filename.split('/');
      const filename = substrings[substrings.length - 1];
      return path.join(this.rootDir, this.streamDir, filename);
    });
  }

  convertMessage(messageIndex, xvizBuilder) {
    const frameToken = this.frames[messageIndex].token;

    const filepath = this.pointCloudFilePathByToken[frameToken];
    if (!fs.existsSync(filepath)) {
      return;
    }
    const buffer = fs.readFileSync(filepath);
    const arraybuffer = toArrayBuffer(buffer);
    const pointCloud = this._parsePointCloud(arraybuffer);

    xvizBuilder
      .primitive(this.LIDAR_POINTS)
      .points(pointCloud.points)
      .colors(pointCloud.colors);
  }

  getMetadata(xvizMetaBuilder, {sensorCalibrations}) {
    const {rotation, translation} = sensorCalibrations.LIDAR_TOP;
    const position = {
      x: translation[0],
      y: translation[1],
      z: translation[2]
    };

    const orientation = quaternionToEulerAngle(...rotation);

    const xb = xvizMetaBuilder;
    xb.stream(this.LIDAR_POINTS)
      .category('primitive')
      .type('point')

      .coordinate('VEHICLE_RELATIVE')
      .pose(position, orientation)

      .streamStyle({
        fill_color: '#00a',
        radiusPixels: 1
      });
  }

  _parsePointCloud(arraybuffer) {
    // (x, y, z, intensity, ring index)
    // https://github.com/nutonomy/nuscenes-devkit/blob/master/python-sdk/nuscenes_utils/data_classes.py#L30
    const data = parseBinary(arraybuffer);

    assert(data.length % 5 === 0);
    const numOfPoints = data.length / 5;
    const points = new Float32Array(numOfPoints * 3);
    const colors = new Uint8Array(4 * numOfPoints).fill(255);

    for (let i = 0; i < numOfPoints; i++) {
      points[i * 3] = data[i * 5];
      points[i * 3 + 1] = data[i * 5 + 1];
      points[i * 3 + 2] = data[i * 5 + 2];

      const intensity = data[i * 5 + 3] / 255;
      colors[i * 4 + 0] = 80 + intensity * 80;
      colors[i * 4 + 1] = 80 + intensity * 80;
      colors[i * 4 + 2] = 80 + intensity * 60;
    }

    return {
      points,
      colors
    };
  }
}
