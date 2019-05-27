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
import {parseJsonFile} from '../common';
import {loadObjects} from '../parsers/parse-objects';

export const OBJECT_PALATTE = {
  ['/human/pedestrian/adult']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/child']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/wheelchair']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/personal_mobility']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/police_officer']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/construction_worker']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/human/pedestrian/stroller']: {
    fill_color: '#FEC56480',
    stroke_color: '#FEC564'
  },
  ['/animal']: {
    fill_color: '#D6A00080',
    stroke_color: '#D6A000'
  },
  ['/vehicle/car']: {
    fill_color: '#7DDDD780',
    stroke_color: '#7DDDD7'
  },
  ['/vehicle/motorcycle']: {
    fill_color: '#EEA2AD80',
    stroke_color: '#EEA2AD'
  },
  ['/vehicle/bicycle']: {
    fill_color: '#DA70BF80',
    stroke_color: '#DA70BF'
  },
  ['/vehicle/bus/bendy']: {
    fill_color: '#267E6380',
    stroke_color: '#267E63'
  },
  ['/vehicle/bus/rigid']: {
    fill_color: '#267E6380',
    stroke_color: '#267E63'
  },
  ['/vehicle/truck']: {
    fill_color: '#267E6380',
    stroke_color: '#267E63'
  },
  ['/vehicle/construction']: {
    fill_color: '#267E6380',
    stroke_color: '#267E63'
  },
  ['/vehicle/emergency/ambulance']: {
    fill_color: '#BE4A4780',
    stroke_color: '#BE4A47'
  },
  ['/vehicle/emergency/police']: {
    fill_color: '#BE4A4780',
    stroke_color: '#BE4A47'
  },
  ['/vehicle/trailer']: {
    fill_color: '#267E6380',
    stroke_color: '#267E63'
  },
  ['/movable_object/barrier']: {
    fill_color: '#6495ED80',
    stroke_color: '#6495ED'
  },
  ['/movable_object/trafficcone']: {
    fill_color: '#6495ED80',
    stroke_color: '#6495ED'
  },
  ['/movable_object/pushable_pullable']: {
    fill_color: '#6495ED80',
    stroke_color: '#6495ED'
  },
  ['/movable_object/debris']: {
    fill_color: '#6495ED80',
    stroke_color: '#6495ED'
  },
  ['/static_object/bicycle_rack']: {
    fill_color: '#8B887880',
    stroke_color: '#8B8878'
  }
};

export default class ObjectsConverter {
  constructor(rootDir, streamFile) {
    this.rootDir = rootDir;
    this.streamFile = streamFile;
    this.objectsByFrame = {};
    this.timestamps = [];

    this.OBJECTS_TRACKING_POINT = '/objects/tracking_point';
    this.OBJECTS_TRAJECTORY = '/objects/trajectory';
  }

  load({staticData, frames}) {
    this.frames = frames;

    const objects = parseJsonFile(this.rootDir, this.streamFile);
    this.objectsByFrame = loadObjects(objects, staticData.instances);
  }

  convertMessage(messageIndex, xvizBuilder) {
    // only key frames have objects data
    // each frame has a unique token,
    // each keyframe has a unique sample_token
    const frameToken = this.frames[messageIndex].sample_token;

    // objects of given sample
    const objects = this.objectsByFrame[frameToken];
    if (objects) {
      Object.keys(objects).forEach((objectToken, i) => {
        const object = objects[objectToken];

        xvizBuilder
          .primitive(object.category)
          .polygon(object.vertices)
          .classes([object.category])
          .style({
            height: object.size[2]
          })
          .id(object.token);

        xvizBuilder
          .primitive(this.OBJECTS_TRACKING_POINT)
          .circle([object.x, object.y, object.z])
          .id(object.token);
      });

      Object.values(objects).forEach(object => {
        const objectTrajectory = this._getObjectTrajectory(
          object,
          messageIndex,
          Math.min(messageIndex + 50, this.frames.length)
        );

        xvizBuilder.primitive(this.OBJECTS_TRAJECTORY).polyline(objectTrajectory);
      });
    }
  }

  getMetadata(xvizMetaBuilder, {staticData}) {
    const xb = xvizMetaBuilder;

    Object.values(staticData.categories).forEach(category => {
      xb.stream(category.streamName)
        .category('primitive')
        .type('polygon')
        .coordinate('IDENTITY')

        .streamStyle({
          extruded: true,
          fill_color: '#00000080'
        })

        .styleClass(category.streamName, OBJECT_PALATTE[category.streamName]);
    });

    xb.stream(this.OBJECTS_TRACKING_POINT)
      .category('primitive')
      .type('circle')
      .streamStyle({
        radius: 0.2,
        fill_color: '#FFFF00'
      })
      .coordinate('IDENTITY');

    xb.stream(this.OBJECTS_TRAJECTORY)
      .category('primitive')
      .type('polyline')
      .streamStyle({
        stroke_color: '#FEC557',
        stroke_width: 0.1,
        stroke_width_min_pixels: 1
      })
      .coordinate('IDENTITY');
  }

  _getObjectTrajectory(targetObject, startFrame, endFrame) {
    const trajectory = [];
    for (let i = startFrame; i < endFrame; i++) {
      const startFrameToken = this.frames[startFrame].sample_token;
      const startObject = this.objectsByFrame[startFrameToken][targetObject.instance_token];

      const frameToken = this.frames[i].sample_token;
      const frameObject = this.objectsByFrame[frameToken][targetObject.instance_token];
      if (!frameObject) {
        return trajectory;
      }

      trajectory.push([frameObject.x, frameObject.y, startObject.z]);
    }
    return trajectory;
  }
}
