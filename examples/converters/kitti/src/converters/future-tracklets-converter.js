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
import {
  _getRelativeCoordinates as getRelativeCoordinates,
  _getGeospatialToPoseTransform as getGeospatialToPoseTransform
} from '@xviz/builder';

import {loadTracklets} from '../parsers/parse-tracklets';

const FUTURE_STEPS = 100; // 10 seconds

/**
 * FutureTrackletsConverter uses known data about tracklets to generate
 * "future" data (ie predictions) to demonstrate how they can be generated
 * in XVIZ.
 */
export default class FutureTrackletsConverter {
  constructor(directory, getPoses, ts) {
    this.rootDir = directory;
    this.trackletFile = path.join(directory, 'tracklet_labels.xml');
    this.getPoses = getPoses;
    this.ts = ts;

    // laser scanner relative to GPS position
    // http://www.cvlibs.net/datasets/kitti/setup.php
    this.FIXTURE_TRANSFORM_POSE = {
      x: 0.81,
      y: -0.32,
      z: 1.73
    };

    this.TRACKLETS_FUTURES = '/tracklets/objects/futures';
  }

  load() {
    if (!fs.existsSync(this.trackletFile)) {
      this.trackletFile = null;
      return;
    }

    const xml = fs.readFileSync(this.trackletFile, 'utf8');
    this.data = loadTracklets(xml);

    this.frameStart = this.data.objects.reduce(
      (minFrame, obj) => Math.min(minFrame, obj.firstFrame),
      Number.MAX_SAFE_INTEGER
    );

    this.frameLimit = this.data.objects.reduce(
      (maxFrame, obj) => Math.max(maxFrame, obj.lastFrame),
      0
    );

    if (this.frameStart > this.frameLimit) {
      throw new Error('Invalid frame range');
    }

    // tracklets trajectory is in pose relative coordinate
    this.poses = this.getPoses();
  }

  async convertMessage(messageNumber, xvizBuilder) {
    if (!this.trackletFile) {
      return;
    }

    if (messageNumber < this.frameStart || messageNumber >= this.frameLimit) {
      return;
    }

    const futureFrameLimit = Math.min(messageNumber + FUTURE_STEPS, this.frameLimit);

    for (let i = messageNumber; i < futureFrameLimit; i++) {
      const tracklets = this._convertTrackletsFutureMessage(messageNumber, i);

      tracklets.forEach(tracklet => {
        const future_ts = this.ts[i];
        xvizBuilder
          .futureInstance(this.TRACKLETS_FUTURES, future_ts)
          .polygon(tracklet.vertices)
          .classes([tracklet.objectType])
          .id(tracklet.id);
      });
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.TRACKLETS_FUTURES)
      .category('future_instance')
      .type('polygon')
      .streamStyle({
        stroke_width: 0.1,
        extruded: false,
        fill_color: '#00000080'
      })
      .styleClass('Car', {
        fill_color: '#50B3FF80',
        stroke_color: '#50B3FF'
      })
      .styleClass('Cyclist', {
        fill_color: '#957FCE80',
        stroke_color: '#957FCE'
      })
      .styleClass('Pedestrian', {
        fill_color: '#FFC6AF80',
        stroke_color: '#FFC6AF'
      })
      .styleClass('Van', {
        fill_color: '#5B91F480',
        stroke_color: '#5B91F4'
      })
      .styleClass('Unknown', {
        fill_color: '#E2E2E280',
        stroke_color: '#E2E2E2'
      })
      .coordinate('VEHICLE_RELATIVE')
      .pose(this.FIXTURE_TRANSFORM_POSE);
  }

  // create set of data for the currentFrameIndex that represents the tracklets from the futureFrameIndex
  _convertTrackletsFutureMessage(currentFrameIndex, futureFrameIndex) {
    return (
      this.data.objects
        // make sure object exists in current frame and the future frame
        .filter(
          object => currentFrameIndex >= object.firstFrame && futureFrameIndex < object.lastFrame
        )
        .map(object => {
          const currentVehiclePose = this.poses[currentFrameIndex].pose;
          const futureVehiclePose = this.poses[futureFrameIndex].pose;

          // This will return the transform to convert from the futureVehiclePose
          // to the currentVehiclePose
          const transform = getGeospatialToPoseTransform(futureVehiclePose, currentVehiclePose);

          // This is the tracklet position in the future, relative to the futureVehiclePose
          const futurePoseIndex = futureFrameIndex - object.firstFrame;
          const pose = this._makePoseShape(object.data.poses.item[futurePoseIndex]);

          // Translate the future position
          const v = transform.transform([pose.x, pose.y, pose.z]);
          pose.x = v[0];
          pose.y = v[1];
          pose.z = v[2];
          // Update the relative pose of the object
          pose.yaw -= currentVehiclePose.yaw - futureVehiclePose.yaw;

          const vertices = getRelativeCoordinates(object.bounds, pose);

          return {
            ...object,
            ...pose,
            vertices
          };
        })
    );
  }

  _makePoseShape(trackletPose) {
    return {
      x: Number(trackletPose.tx),
      y: Number(trackletPose.ty),
      z: Number(trackletPose.tz),
      roll: Number(trackletPose.rx),
      pitch: Number(trackletPose.ry),
      yaw: Number(trackletPose.rz)
    };
  }
}
