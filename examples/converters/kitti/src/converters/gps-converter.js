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
import process from 'process';

import {_getPoseTrajectory} from '@xviz/builder';

import BaseConverter from './base-converter';
import {loadOxtsPackets} from '../parsers/parse-gps-data';
import {MOTION_PLANNING_STEPS} from './constant';

const RADIAN_TO_DEGREE = 180 / Math.PI;

export default class GPSConverter extends BaseConverter {
  constructor(rootDir, streamDir) {
    super(rootDir, streamDir);

    // XVIZ stream names produced by this converter
    this.VEHICLE_ACCELERATION = '/vehicle/acceleration';
    this.VEHICLE_VELOCITY = '/vehicle/velocity';
    this.VEHICLE_TRAJECTORY = '/vehicle/trajectory';
    this.VEHICLE_WHEEL = '/vehicle/wheel_angle';
    this.VEHICLE_AUTONOMOUS = '/vehicle/autonomy_state';
  }

  load() {
    super.load();

    // Load all files because we need them for the trajectory
    this.poses = this.fileNames.map((fileName, i) => {
      const srcFilePath = path.join(this.dataDir, fileName);
      return this._convertPose(srcFilePath, this.timestamps[i]);
    });
  }

  getPose(messageNumber) {
    return this.poses[messageNumber].pose;
  }

  getPoses() {
    return this.poses;
  }

  async convertMessage(messageNumber, xvizBuilder) {
    const entry = this.poses[messageNumber];

    const {pose, velocity, acceleration} = entry;
    process.stdout.write(`processing message ${messageNumber}/${this.timestamps.length}\r`); // eslint-disable-line

    // Every message *MUST* have a pose. The pose can be considered
    // the core reference point for other data and usually drives the timing
    // of the system.
    xvizBuilder
      .pose('/vehicle_pose')
      .timestamp(pose.timestamp)
      .mapOrigin(pose.longitude, pose.latitude, pose.altitude)
      .orientation(pose.roll, pose.pitch, pose.yaw)
      .position(0, 0, 0);

    // This is an example of using the XVIZBuilder to convert your data
    // into XVIZ.
    //
    // The fluent-API makes this construction self-documenting.
    xvizBuilder
      .timeSeries(this.VEHICLE_VELOCITY)
      .timestamp(velocity.timestamp)
      .value(velocity['velocity-forward']);

    xvizBuilder
      .timeSeries(this.VEHICLE_ACCELERATION)
      .timestamp(acceleration.timestamp)
      .value(acceleration['acceleration-forward']);

    xvizBuilder
      .timeSeries(this.VEHICLE_WHEEL)
      .timestamp(velocity.timestamp)
      .value(velocity['angular-rate-upward'] * RADIAN_TO_DEGREE);

    // kitti dataset is always under autonomous mode
    xvizBuilder
      .timeSeries(this.VEHICLE_AUTONOMOUS)
      .timestamp(velocity.timestamp)
      .value('autonomous');

    const poseTrajectory = _getPoseTrajectory({
      poses: this.poses,
      startFrame: messageNumber,
      endFrame: Math.min(messageNumber + MOTION_PLANNING_STEPS, this.poses.length)
    });

    xvizBuilder.primitive(this.VEHICLE_TRAJECTORY).polyline(poseTrajectory);
  }

  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    const xb = xvizMetaBuilder;
    xb.stream('/vehicle_pose')
      .category('pose')

      .stream(this.VEHICLE_ACCELERATION)
      .category('time_series')
      .type('float')
      .unit('m/s^2')

      .stream(this.VEHICLE_VELOCITY)
      .category('time_series')
      .type('float')
      .unit('m/s')

      .stream(this.VEHICLE_WHEEL)
      .category('time_series')
      .type('float')
      .unit('deg/s')

      .stream(this.VEHICLE_AUTONOMOUS)
      .category('time_series')
      .type('string')

      .stream(this.VEHICLE_TRAJECTORY)
      .category('primitive')
      .type('polyline')
      .coordinate('VEHICLE_RELATIVE')

      // This styling information is applied to *all* objects for this stream.
      // It is possible to apply inline styling on individual objects.
      .streamStyle({
        stroke_color: '#47B27588',
        stroke_width: 1.4,
        stroke_width_min_pixels: 1
      });
  }

  _convertPose(filePath, timestamp) {
    const fileContent = fs.readFileSync(filePath, 'utf8').split('\n')[0];

    const oxts = loadOxtsPackets(fileContent);
    return this._convertPoseEntry(oxts, timestamp);
  }

  // Convert raw data into properly parsed objects
  // @return {pose, velocity, acceleration}
  _convertPoseEntry(oxts, timestamp) {
    const {
      lat,
      lon,
      alt,
      roll,
      pitch,
      yaw,
      vn,
      ve,
      vf,
      vl,
      vu,
      ax,
      ay,
      az,
      af,
      al,
      au,
      wx,
      wy,
      wz,
      wf,
      wl,
      wu
    } = oxts;
    const resMap = {};

    resMap.pose = {
      timestamp,
      latitude: Number(lat),
      longitude: Number(lon),
      altitude: Number(alt),
      roll: Number(roll),
      pitch: Number(pitch),
      yaw: Number(yaw)
    };

    resMap.velocity = {
      timestamp,
      'velocity-north': Number(vn),
      'velocity-east': Number(ve),
      'velocity-forward': Number(vf),
      'velocity-left': Number(vl),
      'velocity-upward': Number(vu),
      'angular-rate-x': Number(wx),
      'angular-rate-y': Number(wy),
      'angular-rate-z': Number(wz),
      'angular-rate-forward': Number(wf),
      'angular-rate-left': Number(wl),
      'angular-rate-upward': Number(wu)
    };

    resMap.acceleration = {
      timestamp,
      'acceleration-x': Number(ax),
      'acceleration-y': Number(ay),
      'acceleration-z': Number(az),
      'acceleration-forward': Number(af),
      'acceleration-left': Number(al),
      'acceleration-upward': Number(au)
    };

    return resMap;
  }
}
