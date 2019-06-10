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
import {Converter, quaternionToEuler} from '@xviz/ros';
import {TimeUtil} from 'rosbag';

const VEHICLE_ACCELERATION = '/vehicle/acceleration';
const VEHICLE_VELOCITY = '/vehicle/velocity';
const VEHICLE_WHEEL = '/vehicle/wheel_angle';

const RADIAN_TO_DEGREE = 180 / Math.PI;

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

  _convertVehicleState(frame, xvizBuilder) {
    const msg = frame['/vehicle_state'];
    if (!msg) {
      return null;
    }

    const {timestamp, message} = msg[msg.length - 1];
    const {state} = message;
    const ts = TimeUtil.toDate(timestamp).getTime() / 1e3;

    xvizBuilder
      .timeSeries(VEHICLE_WHEEL)
      .timestamp(ts)
      .value(state.steering_angle * RADIAN_TO_DEGREE);

    xvizBuilder
      .timeSeries(VEHICLE_VELOCITY)
      .timestamp(ts)
      .value(VecMagnitude(state.velocity.linear));

    xvizBuilder
      .timeSeries(VEHICLE_ACCELERATION)
      .timestamp(ts)
      .value(VecMagnitude(state.acceleration.linear));

    const rotation = quaternionToEuler(state.pose.orientation);
    return {rotation};
  }

  async convertMessage(frame, xvizBuilder) {
    const msg = frame[this.topic];
    if (!msg) {
      return;
    }

    const {timestamp, message} = msg[msg.length - 1];

    // Collect wheel angle and other vehicle metrics
    const state = this._convertVehicleState(frame, xvizBuilder);

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    // Position, decimal degrees
    const ts = TimeUtil.toDate(timestamp).getTime() / 1e3;
    const poseBuilder = xvizBuilder
      .pose(this.xvizStream)
      .mapOrigin(message.longitude, message.latitude, message.altitude)
      .timestamp(ts);

    // mapOrigin handles this.
    poseBuilder.position(0, 0, 0);

    // Add rotation to the pose
    if (state && state.rotation) {
      const {rotation} = state;
      poseBuilder.orientation(rotation.roll, rotation.pitch, rotation.yaw);
    }
  }

  getMetadata(xvizMetaBuilder) {
    console.log('metdata')
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    console.log(JSON.stringify(xvizMetaBuilder.getMetadata(), null, 2));
    xvizMetaBuilder
      .stream(this.xvizStream)
      .category('pose')

      .stream(VEHICLE_ACCELERATION)
      .category('time_series')
      .type('float')
      .unit('m/s^2')

      .stream(VEHICLE_VELOCITY)
      .category('time_series')
      .type('float')
      .unit('m/s')

      .stream(VEHICLE_WHEEL)
      .category('time_series')
      .type('float')
      .unit('deg/s');

    console.log(JSON.stringify(xvizMetaBuilder.getMetadata(), null, 2));

    console.log('metdata-done');
  }
}

function VecMagnitude(vec) {
  const {x, y, z} = vec;
  return Math.sqrt(x*x + y*y + z*z);
}
