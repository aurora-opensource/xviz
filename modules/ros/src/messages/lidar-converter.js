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
import _ from 'lodash';
import {loadProcessedLidarData} from './lib/parse-lidar-points';

// const MAX_POINTS = 20000;

/**
 * This just does a very basic random downsampling based on the ratio of
 * maxPointsCount and actual points in the point cloud. As such, it is not guaranteed
 * to exactly cap at maxPointsCount.
 */
/*
function downSamplePoints(points, maxPointsCount) {
  const chunkSize = 3;
  const pointsCount = points.length / chunkSize;

  if (pointsCount <= maxPointsCount) {
    return points;
  }

  const sampleRate = maxPointsCount / pointsCount;
  const ret = [];
  for (let i = 0; i < points.length / chunkSize; i++) {
    if (Math.random() < sampleRate) {
      for (let j = 0; j < chunkSize; j++) {
        ret.push(points[i * chunkSize + j]);
      }
    }
  }

  return Float32Array.from(ret);
}
*/

export class LidarConverter {
  constructor(topic, xvizStream) {
    this.topic = topic;
    this.LIDAR_POINTS = xvizStream || topic;
    this.previousData = {};
  }

  static get topicType() {
    return 'sensor_msgs/PointCloud2';
  }

  async convertFrame(frame, xvizBuilder) {
    this._buildPoints(frame, xvizBuilder, {
      topic: this.topic,
      color: '#00ff00aa'
    });
  }

  _buildPoints(frame, xvizBuilder, {color, topic}) {
    let data = frame[topic];
    if (!data) {
      data = this.previousData[topic];
      if (!data) {
        return;
      }
    }
    this.previousData[topic] = data;

    for (const {message} of data) {
      const pointsSize = message.data.length / (message.height * message.width);
      const {positions} = loadProcessedLidarData(message.data, pointsSize);

      xvizBuilder
        .primitive(this.LIDAR_POINTS)
        // .points(downSamplePoints(positions, MAX_POINTS))
        .points(positions)
        .style({fill_color: color});
    }
  }

  getMetadata(xvizMetaBuilder, frameIdToPoseMap) {
    const streamMetadata = xvizMetaBuilder
      .stream(this.LIDAR_POINTS)
      .category('primitive')
      .type('point')
      .streamStyle({
        fill_color: '#00a',
        radiusPixels: 3
      });

    const pose = (frameIdToPoseMap || {}).velodyne;
    if (pose) {
      streamMetadata
        .pose(_.pick(pose, ['x', 'y', 'z']), _.pick(pose, ['pitch', 'roll', 'yaw']))
        .coordinate('VEHICLE_RELATIVE');
    }
  }
}
