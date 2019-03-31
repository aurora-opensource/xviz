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
import fs from 'fs';
import path from 'path';
import {_getPoseTrajectory} from '@xviz/builder';
import {getTimestamps, createDir, nanosecondsToXVIZDateTime} from '../parsers/common';

import BaseConverter from './base-converter';
import {loadOxtsPackets} from '../parsers/parse-gps-data';
import {MOTION_PLANNING_STEPS, PRIMARY_POSE_STREAM} from './constant';

const RADIAN_TO_DEGREE = 180 / Math.PI;

export default class GPSConverter extends BaseConverter {
  constructor(dbPath, topicName) {
    super(dbPath, topicName);
  }

  async load() {
    super.load();
    this.numMessages = await this.getNumberOfFrames();
  }

  getPose(frameNumber) {
    //return this.poses[frameNumber].pose;
  }

  getPoses() {
    //return this.poses;
  }

  async getNumberOfFrames() {
    const this_ = this;
    const topicId = 4;
    return new Promise(function(resolve, reject) {
      this_.db.get(
        'SELECT count(*) FROM messages WHERE topic_id=$topicId',
        {
          $topicId: topicId
        },
        resolve
      );
    });
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
    console.log(timestamp);

    const base64Message = this.deserializeRosMessage(data, messageType, this.topicName);

    let buff = Buffer.from(base64Message, 'base64');
    const rosMessage = JSON.parse(buff.toString('ascii'));
    console.log(rosMessage);
    const [latitude, longitude, altitude] = rosMessage;

    //console.log(`processing gps data frame ${frameNumber}/${this.numMessages}`); // eslint-disable-line

    // Every frame *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    xvizBuilder
      .pose('/vehicle_pose')
      .timestamp(nanosecondsToXVIZDateTime(timestamp))
      .mapOrigin(Number(longitude), Number(latitude), Number(altitude))
      .orientation(0.0, 0.0, 0.0)
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
