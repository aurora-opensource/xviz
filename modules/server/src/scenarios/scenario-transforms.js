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

import {XVIZBuilder} from '@xviz/builder';

/* Generated XVIZ for a scenario that is demonstrates
 * various transformations.
 */

/* eslint-disable camelcase */
const DEG_45_AS_RAD = Math.PI / 4;

// Color for each
const defaultColor = [80, 80, 80];
const rollColor = [200, 0, 0]; // red
const pitchColor = [128, 0, 128]; // purple
const yawColor = [200, 200, 0]; // yellow

const txColor = [30, 100, 30];
const tyColor = [60, 200, 60];
const tzColor = [90, 250, 90];

const txyawColor = [220, 180, 50];
const txyaw2Color = [220, 180, 150];

const transforms_metadata = {
  type: 'xviz/metadata',
  data: {
    version: '2.0.0'
  }
};

const plate_verts = [[0, 5, 0], [10, 5, 0], [10, -5, 0], [0, -5, 0]];

class TransformsScenario {
  constructor(options = {}) {
    // timestamp needs to be seconds, not milliseconds
    this.timestamp = Date.now() / 1000;

    this.duration = options.duration || 30;
    this.live = options.live;
    this.first = true;

    this.builder = null;
  }

  getMetadata() {
    const metadata = JSON.parse(JSON.stringify(transforms_metadata));

    if (!this.live) {
      const log_start_time = this.timestamp;
      metadata.data.log_info = {
        log_start_time,
        log_end_time: log_start_time + this.duration
      };
    }

    return metadata;
  }

  // Produce both the pose and primitive for this plane
  _drawPlate(stream, position, orientation, fill_color) {
    this.builder
      .pose(stream)
      .position(...position)
      .orientation(...orientation);

    this.builder
      .primitive(stream)
      .polygon(plate_verts)
      .style({
        fill_color
      });
  }

  getMessage(timeOffset) {
    const ts = this.timestamp + timeOffset;
    this.builder = new XVIZBuilder({});
    this.builder.timestamp(ts);

    // This scenario does not have changing geometry
    // so the first message is made persistent, and all
    // subsequent messages will be empty due to an expection
    // by the ScenarioProvider
    if (this.first) {
      this.first = false;

      this._drawPlate('/default', [0, 0, 0], [0, 0, 0], defaultColor);
      this._drawPlate('/roll', [0, 0, 0], [DEG_45_AS_RAD, 0, 0], rollColor);
      this._drawPlate('/pitch', [0, 0, 0], [0, DEG_45_AS_RAD, 0], pitchColor);
      this._drawPlate('/yaw', [0, 0, 0], [0, 0, DEG_45_AS_RAD], yawColor);

      this._drawPlate('/tx', [15, 0, 0], [0, 0, 0], txColor);
      this._drawPlate('/ty', [0, 15, 0], [0, 0, 0], tyColor);
      this._drawPlate('/tz', [0, 0, 15], [0, 0, 0], tzColor);

      // translate then rotate within a single transform
      this._drawPlate('/txyaw', [15, 0, 0], [0, 0, DEG_45_AS_RAD], txyawColor);
      // A chain of translate then rotate
      this._drawPlate('/txyaw_txyaw', [15, 0, 0], [0, 0, DEG_45_AS_RAD], txyaw2Color);

      this.builder.link('/txyaw', '/txyaw_txyaw');

      this.builder.persistent();
    }

    return {
      type: 'xviz/state_update',
      data: this.builder.getMessage()
    };
  }
}

module.exports = {
  transforms: options => new TransformsScenario(options)
};
