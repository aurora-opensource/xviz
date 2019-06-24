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
import {Converter} from '@xviz/ros';
import {TimeUtil} from 'rosbag';

export class SensorImu extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'SensorImu';
  }

  static get messageType() {
    return 'sensor_msgs/Imu';
  }

  async convertMessage(frame, xvizBuilder) {
    const data = frame[this.topic];
    if (!data) {
      return;
    }

    const {timestamp, message} = data[data.length - 1];
    const {
      linear_acceleration: {x, y, z}
    } = message;
    const accel = Math.sqrt(x * x + y * y + z * z);

    xvizBuilder
      .timeSeries(this.xvizStream)
      .timestamp(TimeUtil.toDate(timestamp).getTime() / 1e3)
      .value(accel);
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    xvizMetaBuilder
      .stream(this.xvizStream)
      .category('time_series')
      .type('float')
      .unit('m/s^2');
  }
}
