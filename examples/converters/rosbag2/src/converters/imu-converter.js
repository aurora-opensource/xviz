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
import {nanosecondsToXVIZDateTime} from '../parsers/common';
let qte = require('quaternion-to-euler');

import BaseConverter from './base-converter';

const RADIAN_TO_DEGREE = 180 / Math.PI;

export default class GPSConverter extends BaseConverter {
  constructor(dbPath, topicName) {
    super(dbPath, topicName);
  }

  async load() {
    super.load();
  }

  async convertFrame(frameNumber, xvizBuilder) {
    const messageType = await this.getMessageType(this.db, this.topicName);

    let serializedRosMessage;

    try {
      serializedRosMessage = await this.getMessage(frameNumber, this.topicId);
    } catch (e) {
      console.log('error getting message ', e);
    }

    const {timestamp, data} = serializedRosMessage;

    const base64Message = this.deserializeRosMessage(data, messageType, this.topicName);

    let buff = Buffer.from(base64Message, 'base64');
    const rosMessage = JSON.parse(buff.toString('ascii'));
    const [x, y, z, w] = rosMessage;
    const [roll, pitch, yaw] = qte([w, x, y, z]);

    //console.log(`processing imu data frame ${frameNumber}/${this.numMessages}`); // eslint-disable-line

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    xvizBuilder
      .pose('/vehicle_pose')
      .orientation(roll, pitch, yaw)
      .position(0, 0, 0);
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    const xb = xvizMetaBuilder;
    xb.stream('/vehicle_pose')
      .category('pose')

      // This styling information is applied to *all* objects for this stream.
      // It is possible to apply inline styling on individual objects.
      .streamStyle({
        stroke_color: '#47B27588',
        stroke_width: 1.4,
        stroke_width_min_pixels: 1
      });
  }
}
