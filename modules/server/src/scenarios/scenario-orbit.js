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
 * circular path on a grid
 * - no start end time in metadata
 * - stream metadata for coordinate & styling
 */
/* eslint-disable camelcase */
const DEG_1_AS_RAD = Math.PI / 180;

const orbit_metadata = {
  type: 'xviz/metadata',
  data: {
    version: '2.0.0'
  }
};

class OrbitScenario {
  constructor(options = {}) {
    // timestamp needs to be seconds, not milliseconds
    this.timestamp = 0;

    this.radius = options.radius || 30;
    this.duration = options.duration || 10;
    this.live = options.live;
    this.speed = options.speed || 10; // meters per second

    this.first = true;
  }

  getMetadata() {
    const metadata = JSON.parse(JSON.stringify(orbit_metadata));

    if (!this.live) {
      const log_start_time = this.timestamp;
      metadata.data.log_info = {
        log_start_time,
        log_end_time: log_start_time + this.duration
      };
    }

    return metadata;
  }

  getMessage(timeOffset) {
    if (this.first) {
      this.first = false;
      return this._getFirstMessage(timeOffset);
    }
    return this._getMessage(timeOffset);
  }

  _getFirstMessage(timeOffset) {
    const timestamp = this.timestamp + timeOffset;

    return {
      type: 'xviz/state_update',
      data: {
        update_type: 'PERSISTENT',
        updates: [
          {
            timestamp,
            poses: this._drawPoses(timestamp),
            links: this._drawLinks(timestamp),
            primitives: this._drawOrbs(timestamp)
          }
        ]
      }
    };
  }

  _getMessage(timeOffset) {
    const timestamp = this.timestamp + timeOffset;

    return {
      type: 'xviz/state_update',
      data: {
        update_type: 'INCREMENTAL',
        updates: [
          {
            timestamp,
            poses: this._drawDynamicPoses(timestamp),
            links: this._drawDynamicLinks(timestamp)
          }
        ]
      }
    };
  }

  _drawLinks(parent, child) {
    const makeLink = (p, c) => {
      return {
        [c]: {
          target_pose: p
        }
      };
    };

    return {
      ...makeLink('/system', '/sun_pose'),
      ...makeLink('/system', '/earth_orbit'),
      ...makeLink('/system', '/mars_orbit'),
      ...makeLink('/sun_pose', '/sun'),
      ...makeLink('/earth_orbit', '/earth_pose'),
      ...makeLink('/earth_pose', '/earth'),
      ...makeLink('/moon_orbit', '/moon_pose'),
      ...makeLink('/moon_pose', '/moon'),
      ...makeLink('/mars_orbit', '/mars_pose'),
      ...makeLink('/mars_pose', '/mars')
    };
  }

  _drawDynamicLinks(timestamp) {
    const cycle = timestamp % 10;
    let target_pose = '/earth_pose';

    if (cycle > 5) {
      target_pose = '/mars_pose';
    }

    return {
      ['/moon_orbit']: {
        target_pose
      }
    };
  }

  _drawPoses(timestamp) {
    return {
      '/vehicle_pose': {
        orientation: [0, 0, 0],
        position: [0, 0, 0]
      },
      '/system': {
        orientation: [0, 0, 0],
        position: [0, 0, 0]
      }
    };
  }

  _drawDynamicPoses(timestamp) {
    // const circumference = Math.PI * this.radius * 2;
    // const degreesPerSecond = 360 / (circumference / this.speed);
    const degreesPerSecond = 45;
    const currentDegrees = timestamp * degreesPerSecond;
    const angle = currentDegrees * DEG_1_AS_RAD;

    const makePose = (name, distance, zAngle) => {
      return {
        [name]: {
          orientation: [0, 0, zAngle],
          position: [distance, 0, 0]
        }
      };
    };

    return {
      ...makePose('/earth_orbit', 0, angle),
      ...makePose('/moon_orbit', 0, angle),
      ...makePose('/mars_orbit', 0, -angle),
      ...makePose('/sun_pose', 0, angle),
      ...makePose('/earth_pose', 25, angle),
      ...makePose('/moon_pose', 10, angle),
      ...makePose('/mars_pose', 50, angle)
    };
  }

  _drawOrb(name, radius, color) {
    // Have grid extend beyond car path
    return {
      [name]: {
        circles: [
          {
            center: [0.0, 0.0, 0.0],
            radius,
            base: {
              style: {
                fill_color: color
              }
            }
          }
        ]
      }
    };
  }

  _drawOrbs(name, radius, color) {
    // Have grid extend beyond car path
    return {
      ...this._drawOrb('/sun', 9, [255, 180, 40]),
      ...this._drawOrb('/earth', 5, [20, 50, 190]),
      ...this._drawOrb('/moon', 1, [200, 200, 200]),
      ...this._drawOrb('/mars', 4, [255, 0, 0])
    };
  }
}

module.exports = {
  orbit: options => new OrbitScenario(options)
};
