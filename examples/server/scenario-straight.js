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

/* Generated XVIZ for a scenario that is a
 * straight path with relative horizontal lines
 * for movement indication
 * - no start end time in metadata
 * - no streams in metadata
 *   - this forces everything to be vehicle_relative
 */

const DEG_1_AS_RAD = Math.PI / 180;

const straight_metadata = {
  type: 'xviz/metadata',
  data: {
    version: '2.0.0'
  }
};

// Special metadata for the non-live test case
const straight_log_metadata = JSON.parse(JSON.stringify(straight_metadata));
straight_log_metadata.data.log_info = {
  log_start_time: 1000,
  log_end_time: 1030
};

class StraightScenario {
  constructor(ts) {
    // Get starting timestamp
    this.timestamp = ts || Date.now() * 1000;
  }

  getFrame(frameNumber) {
    return this._getFrame(frameNumber);
  }

  _getFrame(frameNumber) {
    const timestamp = this.timestamp + 0.1 * frameNumber;

    return {
      type: 'xviz/state_update',
      data: {
        update_type: 'snapshot',
        updates: [
          {
            timestamp,
            poses: this._drawPose(frameNumber, timestamp),
            primitives: this._drawLines(frameNumber)
          }
        ]
      }
    };
  }

  _drawPose(frameNumber, timestamp) {
    return {
      '/vehicle_pose': {
        timestamp,
        orientation: [0, 0, 0],
        position: [0, frameNumber, 0]
      }
    };
  }

  _drawLines(frameNumber) {
    const lineSpacing = [-15, -10, -5, 0, 5, 10, 15, 20];

    const offset = frameNumber % 5;
    const colorCycle = Math.cos(frameNumber * 2 * DEG_1_AS_RAD);
    const lineSpacingXVIZ = lineSpacing.map((x, index) => {
      return {
        base: {
          style: {
            stroke_width: 0.2,
            stroke_color: [
              // Generate cyclical colors
              120 + Math.cos(frameNumber * 2 * DEG_1_AS_RAD) * 90,
              60 + Math.cos(frameNumber * DEG_1_AS_RAD) * 30,
              90 + Math.sin(frameNumber * 3 * DEG_1_AS_RAD) * 60
            ]
          }
        },
        vertices: [x - offset, -40, 0, x - offset, 40, 0]
      };
    });

    return {
      ['/ground_lines']: {
        polylines: lineSpacingXVIZ
      }
    };
  }
}

module.exports = {
  straight: {
    metadata: straight_metadata,
    generator: new StraightScenario()
  },
  straight_log: {
    metadata: straight_log_metadata,
    generator: new StraightScenario(straight_log_metadata.data.log_info.log_start_time)
  }
};
