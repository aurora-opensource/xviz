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
/* global console */
/* eslint-disable no-console */
import {quaternionToEuler} from '../common/quaternion';
import {TimeUtil} from 'rosbag';

export class GeometryPoseStamped {
  constructor(topic, origin, xvizStream = '/vehicle_pose') {
    this.topic = topic;
    this.xvizStream = xvizStream;
    this.origin = origin;
  }

  static get topicType() {
    return 'geometry_msgs/PoseStamped';
  }

  async convertFrame(frame, xvizBuilder) {
    const msg = frame[this.topic];
    if (!msg) {
      return;
    }

    const {timestamp, message} = msg[msg.length - 1];

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    console.log('~time', TimeUtil.toDate(timestamp).getTime() / 1e3);
    // Position, decimal degrees
    const rotation = quaternionToEuler(message.pose.orientation);
    const {position} = message.pose;
    xvizBuilder
      .pose(this.xvizStream)
      .mapOrigin(this.origin.longitude, this.origin.latitude, this.origin.altitude)
      .position(position.x, position.y, 0)
      .orientation(rotation.roll, rotation.pitch, rotation.yaw)
      .timestamp(TimeUtil.toDate(timestamp).getTime() / 1e3);
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    xvizMetaBuilder.stream(this.xvizStream).category('pose');
  }
}
