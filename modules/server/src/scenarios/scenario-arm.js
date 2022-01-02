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

import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

const DEG_1_AS_RAD = Math.PI / 180;

/* Generated XVIZ for a scenario that is demonstrates
 * using the scene graph to model a segmented robotic arm.
 */
class ScenarioArm {
  constructor(options = {}) {
    // timestamp needs to be seconds, not milliseconds
    this.timestamp = Date.now() / 1000;

    this.duration = options.duration || 30;
    this.live = options.live;

    this.segments = 3;
    if (options.segments) {
      this.segments = parseInt(options.segments, 10);
    }
    this.segmentLength = 2;

    this.first = true;
    this.builder = null;
  }

  getMetadata() {
    const xb = new XVIZMetadataBuilder();
    // Defining the streams in the metadata populates the
    // Stream Panel component.
    xb.stream('/base').category('pose');

    for (let i = 0; i < this.segments; i++) {
      xb.stream(`/segment/${i}`)
        .category('primitive')
        .type('polygon')
        .streamStyle({
          extruded: true,
          fill_color: [200, 130, 0]
        })
        .stream(`/joint/${i}`)
        .category('primitive')
        .type('polygon')
        .streamStyle({
          extruded: true,
          fill_color: [100, 130, 0]
        });
    }

    if (!this.live) {
      xb.startTime(this.timestamp).endTime(this.timestamp + this.duration);
    }

    return {
      type: 'xviz/metadata',
      data: xb.getMetadata()
    };
  }

  _updateJoint(id, pitch) {
    const offset = id > 0 ? this.segmentLength : 0;
    this.builder
      .pose(`/joint/${id}`)
      .position(0, 0, offset + 0.25)
      .orientation(0, pitch, 0);
  }

  _drawJoint(id) {
    const offset = this.segmentLength * id;

    // The joints are represented as cubes, with the origin at the center
    const joint_verts = [
      -0.25,
      -0.25,
      -0.25,
      0.25,
      -0.25,
      -0.25,
      0.25,
      0.25,
      -0.25,
      -0.25,
      0.25,
      -0.25
    ];

    this.builder.pose(`/joint/${id}`).position(0, 0, offset + 0.25);
    this.builder
      .primitive(`/joint/${id}`)
      .polygon(joint_verts)
      .style({
        height: 0.5
      });
  }

  _drawSegment(id) {
    // The segments are square shafts
    const segment_verts = [-0.2, -0.2, 0, 0.2, -0.2, 0, 0.2, 0.2, 0, -0.2, 0.2, 0];

    this.builder.pose(`/segment/${id}`).position(0, 0, 0);
    this.builder
      .primitive(`/segment/${id}`)
      .polygon(segment_verts)
      .style({
        height: this.segmentLength
      });
  }

  // Makes the pair-wise call for the list of links
  // based on the number of segments.
  _drawLinks() {
    const links = ['/base'];
    for (let i = 0; i < this.segments; i++) {
      links.push(`/joint/${i}`, `/segment/${i}`);
    }

    links.reduce((prev, curr) => {
      this.builder.link(prev, curr);
      return curr;
    });
  }

  _drawArm() {
    this._drawLinks();

    // Move the base for the arm 5m in front of default origin
    this.builder.pose('/base').position(5, 0, 0);

    for (let i = 0; i < this.segments; i++) {
      this._drawJoint(i);
      this._drawSegment(i);
    }
  }

  _drawUpdates(offset) {
    const p = offset * DEG_1_AS_RAD;
    // Final segment is 5x faster than initial segment
    const m = 5.0 / this.segments;

    for (let i = 0; i < this.segments; i++) {
      // Each segment rotates faster than the preceding segement
      const pitch = p * ((i + 1) * m);
      this._updateJoint(i, pitch);
    }
  }

  getMessage(timeOffset) {
    const ts = this.timestamp + timeOffset;
    this.builder = new XVIZBuilder({});
    this.builder.timestamp(ts);

    if (this.first) {
      // Draw the links & poses & primitives that model the arm
      this.first = false;

      this._drawArm();
      this.builder.persistent();
    } else {
      // Just update the poses for the joints
      this._drawUpdates(timeOffset);
    }

    this.builder.timestamp(ts);
    return {
      type: 'xviz/state_update',
      data: this.builder.getMessage()
    };
  }
}

module.exports = {
  arm: options => new ScenarioArm(options)
};
