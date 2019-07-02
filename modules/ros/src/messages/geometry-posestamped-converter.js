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

export class GeometryPoseStamped extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'GeometryPoseStamped';
  }

  static get messageType() {
    return 'geometry_msgs/PoseStamped';
  }

  async convertMessage(frame, xvizBuilder) {
    const msg = frame[this.topic];
    if (!msg) {
      return;
    }

    const {timestamp, message} = msg[msg.length - 1];

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    // Position, decimal degrees
    const rotation = quaternionToEuler(message.pose.orientation);
    const {position} = message.pose;
    const poseBuilder = xvizBuilder
      .pose(this.xvizStream)
      .position(position.x, position.y, 0)
      .orientation(rotation.roll, rotation.pitch, rotation.yaw)
      .timestamp(TimeUtil.toDate(timestamp).getTime() / 1e3);

    if (this.config.origin) {
      const {origin} = this.config;
      poseBuilder.mapOrigin(origin.longitude, origin.latitude, origin.altitude);
    }
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder.stream(this.xvizStream).category('pose');
  }
}
