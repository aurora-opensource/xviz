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
import Converter from './converter';
import {quaternionToEuler} from '../common/quaternion';
import {TimeUtil} from 'rosbag';

export class SensorNavSatFix extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'SensorNavSatFix';
  }

  static get messageType() {
    return 'sensor_msgs/NavSatFix';
  }

  _getOrientationFromIMU(frame, xvizBuilder) {
    if (!this.config.imuTopic) {
      return null;
    }

    const msg = frame[this.config.imuTopic];
    if (!msg) {
      return null;
    }

    const {message} = msg[msg.length - 1];
    const rotation = quaternionToEuler(message.orientation);
    return {rotation};
  }

  async convertMessage(frame, xvizBuilder) {
    const msg = frame[this.topic];
    if (!msg) {
      return;
    }

    const {timestamp, message} = msg[msg.length - 1];

    const state = this._getOrientationFromIMU(frame, xvizBuilder);

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    const ts = TimeUtil.toDate(timestamp).getTime() / 1e3;
    const poseBuilder = xvizBuilder
      .pose(this.xvizStream)
      .mapOrigin(message.longitude, message.latitude, message.altitude)
      .timestamp(ts)
      .position(0, 0, 0);

    // Add rotation to the pose
    if (state && state.rotation) {
      const {rotation} = state;
      poseBuilder.orientation(rotation.roll, rotation.pitch, rotation.yaw);
    }
  }

  getMetadata(xvizMetaBuilder, context) {
    xvizMetaBuilder.stream(this.xvizStream).category('pose');
  }
}
