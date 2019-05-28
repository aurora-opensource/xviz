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

/*  eslint-disable camelcase */
import {parseJsonFile, toMap, quaternionToEulerAngle} from '../common';

export default class GPSConverter {
  constructor(rootDir, streamFile) {
    this.rootDir = rootDir;
    this.streamFile = streamFile;
    this.poseByFrames = {};
    this.timestamps = [];

    this.VEHICLE_POSE = '/vehicle_pose';
    this.VEHICLE_TRAJECTORY = '/vehicle/trajectory';
  }

  load({frames}) {
    this.frames = frames;

    const poses = this._loadPoses();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const poseToken = frame.ego_pose_token;
      const pose = poses[poseToken];
      const {roll, pitch, yaw} = quaternionToEulerAngle(...pose.rotation);
      const [x, y, z] = pose.translation;
      // nanoseconds to seconds
      const timestamp = pose.timestamp / 1e6;

      this.timestamps.push(timestamp);

      this.poseByFrames[frame.token] = {
        timestamp,
        x,
        y,
        z,
        roll,
        pitch,
        yaw,
        rawData: pose
      };
    }
  }

  convertMessage(messageIndex, xvizBuilder) {
    const frameToken = this.frames[messageIndex].token;

    const pose = this.poseByFrames[frameToken];
    xvizBuilder
      .pose(this.VEHICLE_POSE)
      .timestamp(pose.timestamp)
      .mapOrigin(0, 0, 0)
      .position(pose.x, pose.y, pose.z)
      .orientation(pose.roll, pose.pitch, pose.yaw);

    const poseTrajectory = this._getPoseTrajectory(
      messageIndex,
      Math.min(this.frames.length, messageIndex + 50)
    );
    xvizBuilder.primitive(this.VEHICLE_TRAJECTORY).polyline(poseTrajectory);
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.VEHICLE_POSE)
      .category('pose')

      .stream(this.VEHICLE_TRAJECTORY)
      .category('primitive')
      .type('polyline')
      .coordinate('IDENTITY')
      .streamStyle({
        stroke_color: '#57AD57AA',
        stroke_width: 1.4,
        stroke_width_min_pixels: 1
      });
  }

  getPoses() {
    return this.poseByFrames;
  }

  _getPoseTrajectory(startFrame, endFrame) {
    const poses = [];
    for (let i = startFrame; i < endFrame; i++) {
      const frameToken = this.frames[i].token;
      const currPose = this.poseByFrames[frameToken];
      poses.push([currPose.x, currPose.y, currPose.z]);
    }
    return poses;
  }

  _loadPoses() {
    const poses = parseJsonFile(this.rootDir, this.streamFile);
    return toMap(poses, 'token');
  }
}
