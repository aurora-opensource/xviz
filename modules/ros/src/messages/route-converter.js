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
import {ROUTE} from '../topics';
import Converter from './base/converter';

export default class RouteConverter extends Converter {
  constructor(xvizNamespace) {
    super();
    this.ROUTE = xvizNamespace;
  }

  convertFrame(frame, xvizBuilder) {
    let routeMessages = frame[ROUTE];
    if (!routeMessages) {
      if (!this.previousRouteMessages) {
        return;
      }
      routeMessages = this.previousRouteMessages;
    }
    this.previousRouteMessages = routeMessages;

    for (const {message} of routeMessages) {
      const {markers} = message;
      const points = _.chain(markers)
        .map('points')
        .reject(_.isEmpty)
        .flatten()
        .slice(0, -2) // Our last point seems to return to origin, so chop it off
        .map(p => [p.x, p.y, 0])
        .value();

      if (!_.isEmpty(points)) {
        xvizBuilder
          .primitive(this.ROUTE)
          .polyline(points)
          .style({
            stroke_color: [0, 0, 255, 60]
          })
          .id(uuid());
      }
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.ROUTE)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_width: 3,
        stroke_width_min_pixels: 1
      });
  }
}
