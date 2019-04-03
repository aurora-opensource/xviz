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
import {MP_PLAN} from '../topics';

export default class MotionPlanningConverter {
  constructor(xvizNamespace) {
    this.ns = xvizNamespace;

    this.PLAN_STREAM = [this.ns, 'plan'].join('/');
  }

  convertFrame(frame, xvizBuilder) {
    const planMessages = frame[MP_PLAN];
    if (!planMessages) {
      return;
    }

    for (const {message} of planMessages) {
      const {poses} = message;
      const points = _.chain(poses)
        .map(p => _.get(p, 'pose.position'))
        .reject(_.isEmpty)
        .flatten()
        .map(p => [p.x, p.y, 0])
        .value();

      if (!_.isEmpty(points)) {
        xvizBuilder
          .primitive(this.PLAN_STREAM)
          .polyline(points)
          .style({stroke_color: [0, 255, 255, 255]})
          .id(uuid());
      }
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.PLAN_STREAM)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_width: 0.2,
        stroke_width_min_pixels: 1
      });
  }
}
