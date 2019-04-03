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
import {TRACKS_LIST} from '../topics';

export default class TrackletsConverter {
  constructor(xvizNamespace) {
    this.TRACKLETS = xvizNamespace;
  }

  _shapeBottomToPolygon(shapeBottom) {
    if (shapeBottom.points) {
      // Older bags have this format
      return shapeBottom.points.map(p => [p.x, p.y, 0]);
    } else if (shapeBottom.data) {
      return _.map(_.chunk(shapeBottom.data, 3), p => [p[0], p[1], 0] /* zero out z */);
    }

    return null;
  }

  convertFrame(frame, xvizBuilder) {
    const trackMessages = frame[TRACKS_LIST];
    if (!trackMessages) {
      return;
    }

    for (const {message} of trackMessages) {
      const tracks = message.confirmed_tracks;
      for (const track of tracks) {
        const polygon = this._shapeBottomToPolygon(track.shape_bottom);
        if (polygon) {
          xvizBuilder
            .primitive(this.TRACKLETS)
            .polygon(polygon)
            .classes([this._getClass(track)])
            .id(track.track_id);
        } else {
          console.warn('Unable to parse track.shape_bottom'); // eslint-disable-line
        }
      }
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.TRACKLETS)
      .coordinate('IDENTITY')
      .category('primitive')
      .type('polygon')
      .streamStyle({
        extruded: true,
        wireframe: true,
        // TODO - use dynamic height
        height: 1.2,
        fill_color: '#00000080'
      })
      .styleClass('Car', {
        fill_color: '#7DDDD780',
        stroke_color: '#7DDDD7'
      })
      .styleClass('Cyclist', {
        fill_color: '#DA70BF80',
        stroke_color: '#DA70BF'
      })
      .styleClass('Pedestrian', {
        fill_color: '#FEC56480',
        stroke_color: '#FEC564'
      })
      .styleClass('Van', {
        fill_color: '#267E6380',
        stroke_color: '#267E63'
      })
      .styleClass('Unknown', {
        fill_color: '#D6A00080',
        stroke_color: '#D6A000'
      });
  }

  _getClass(track) {
    // Order has significance
    const CLASSES = ['Car', 'Pedestrian'];

    const {index} = track.class_probabilities.reduce(
      (currentMax, probability, i) => {
        if (probability > currentMax.probability) {
          return {probability, index: i};
        }
        return currentMax;
      },
      {index: -1, probability: -1}
    );

    return CLASSES[index];
  }
}
