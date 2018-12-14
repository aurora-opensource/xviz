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

import {OBJECT_PALATTE} from './objects-converter';
import {loadObjects} from '../parsers/parse-objects';

export default class FutureObjectsConverter {
  constructor(rootDir, streamFile) {
    this.rootDir = rootDir;
    this.streamFile = streamFile;
    this.objectsByFrame = {};
    this.timestamps = [];

    this.OBJECTS_FUTURES = '/objects/futures';
  }

  // sample_token is unique id for a log sample
  // instance_token is unique id for an object across different frames of the sample
  load({staticData, posesByFrame, frames}) {
    const objects = parseJsonFile(this.rootDir, this.streamFile);
    this.objectsByFrame = loadObjects(objects, staticData.instances);

    // object trajectory is in pose relative coordinate
    this.posesByFrame = posesByFrame;
    this.frames = frames;
  }

  convertFrame(frameIndex, xvizBuilder) {
    // Generate predictions for 10 frames
    const futureFrameLimit = Math.min(frameIndex + 10, this.frames.length);

    for (let i = frameIndex; i < futureFrameLimit; i++) {
      const objects = this._convertObjectsFutureFrame(frameIndex, i);
      const frameToken = this.frames[i].token;
      const pose = this.posesByFrame[frameToken];

      objects.forEach(object => {
        const future_ts = pose.timestamp;
        xvizBuilder
          .futureInstance(this.OBJECTS_FUTURES, future_ts)
          .polygon(object.vertices)
          .classes([object.category])
          .id(object.id);
      });
    }
  }

  getMetadata(xvizMetaBuilder, {staticData}) {
    const xb = xvizMetaBuilder;
    xb.stream(this.OBJECTS_FUTURES)
      .category('future_instance')
      .type('polygon')
      .coordinate('IDENTITY')

      .streamStyle({
        stroke_width: 0.1,
        extruded: false,
        wireframe: true,
        fill_color: '#00000080'
      });

    Object.values(staticData.categories).forEach(category => {
      xb.styleClass(category.streamName, OBJECT_PALATTE[category.streamName]);
    });
  }

  // create set of data for the currentFrameIndex that represents the objects from the futureFrameIndex
  _convertObjectsFutureFrame(currentFrameIndex, futureFrameIndex) {
    const currentFrameToken = this.frames[currentFrameIndex].token;
    const currentObjects = this.objectsByFrame[currentFrameToken];

    const futureFrameToken = this.frames[futureFrameIndex].token;
    const futureObjects = this.objectsByFrame[futureFrameToken];

    return Object.keys(currentObjects)
      .filter(token => futureObjects[token])
      .map(token => {
        const currObject = currentObjects[token];
        const futureObject = futureObjects[token];

        // assign current object's z to the future object
        return {
          ...futureObject,
          vertices: futureObject.vertices.map((v, i) => [v[0], v[1], currObject.vertices[i][2]])
        };
      });
  }
}
