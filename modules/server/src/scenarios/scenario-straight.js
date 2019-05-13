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
 *   - this means primitives have the coordinate IDENTITY
 */
/* eslint-disable camelcase */
const DEG_1_AS_RAD = Math.PI / 180;

const straight_metadata = {
  type: 'xviz/metadata',
  data: {
    version: '2.0.0'
  }
};

class StraightScenario {
  constructor(options = {}) {
    // timestamp needs to be seconds, not milliseconds
    this.timestamp = Date.now() / 1000;
    this.lineGap = 5;

    this.hz = parseInt(options.hz, 10) || 10;
    this.duration = parseInt(options.duration, 10) || 30;
    this.live = Boolean(options.live);
  }

  getMetadata() {
    const metadata = JSON.parse(JSON.stringify(straight_metadata));

    if (!this.live) {
      const log_start_time = this.timestamp;
      metadata.data.log_info = {
        log_start_time,
        log_end_time: log_start_time + this.duration
      };
    }

    return metadata;
  }

  getFrame(frameNumber) {
    return this._getFrame(frameNumber);
  }

  _getFrame(frameNumber) {
    const timestep = 1.0 / this.hz;
    const timestamp = this.timestamp + timestep * frameNumber;

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
        position: [frameNumber, 0, 0]
      }
    };
  }

  _range(start, end, increment = 1) {
    const range = [];
    for (let i = start; i <= end; i += increment) {
      range.push(i * this.lineGap);
    }

    return range;
  }

  _lineColor(x) {
    return [
      // Generate cyclical colors
      120 + Math.cos(x * 2 * DEG_1_AS_RAD) * 90,
      200 + Math.cos(x * DEG_1_AS_RAD) * 30,
      170 + Math.sin(x * 3 * DEG_1_AS_RAD) * 60
    ];
  }

  _drawLines(frameNumber) {
    // Car position matches the frameNumber
    // place the farthest 20
    const lineStart = (frameNumber - 15) / this.lineGap;
    const lineEnd = (frameNumber + 20) / this.lineGap;

    const lineSpacing = this._range(Math.ceil(lineStart), Math.floor(lineEnd));
    const lineSpacingXVIZ = lineSpacing.map(x => {
      return {
        base: {
          style: {
            stroke_width: 0.2,
            stroke_color: this._lineColor(x)
          }
        },
        vertices: [x, -40, 0, x, 40, 0]
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
  straight: options => new StraightScenario(options)
};
