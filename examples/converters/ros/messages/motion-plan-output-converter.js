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
import _ from 'lodash';
import {v4 as uuid} from 'uuid';
import {Converter} from '@xviz/ros';

export class MotionPlanOutput extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'MotionPlanOutput';
  }

  static get messageType() {
    return 'commander_msgs/MotionPlanOutput';
  }

  async convertMessage(frame, xvizBuilder) {
    const data = frame[this.topic];
    if (!data) {
      return;
    }

    for (const {message} of data) {
      const {poses} = message;
      const points = _.chain(poses)
        .map(p => _.get(p, 'pose.position'))
        .reject(_.isEmpty)
        .flatten()
        .map(p => [p.x, p.y, 0])
        .value();

      if (!_.isEmpty(points)) {
        xvizBuilder
          .primitive(this.xvizStream)
          .polyline(points)
          .style({stroke_color: [0, 255, 255, 255]})
          .id(uuid());
      }
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.xvizStream)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_width: 0.2,
        stroke_width_min_pixels: 1
      });
  }
}
