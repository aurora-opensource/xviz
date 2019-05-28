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

import path from 'path';
import fs from 'fs';

import {resizeImage} from './process-image';
import {toMap} from '../common';

export default class ImageConverter {
  constructor(rootDir, camera, options) {
    this.rootDir = rootDir;
    this.camera = camera;
    this.streamName = `/camera/${camera.toLowerCase()}`;

    this.options = options;
  }

  async loadFrame(frameToken) {
    // Load the data for this frame
    const filepath = this.cameraFilePathByToken[frameToken];
    if (fs.existsSync(filepath)) {
      const {maxWidth, maxHeight} = this.options;
      const {data, width, height} = await resizeImage(filepath, maxWidth, maxHeight);
      return {data, width, height};
    }
    return null;
  }

  load({frames}) {
    this.frames = frames;

    this.cameraFilePathByToken = toMap(frames, 'token', frame => {
      if (frame.sensors[this.camera]) {
        const substrings = frame.sensors[this.camera].filename.split('/');
        const filename = substrings[substrings.length - 1];
        return path.join(this.rootDir, this.camera, filename);
      }
      return null;
    });
  }

  async convertMessage(messageIndex, xvizBuilder) {
    const frameToken = this.frames[messageIndex].token;
    const frame = await this.loadFrame(frameToken);
    if (frame) {
      const {data, width, height} = frame;

      xvizBuilder
        .primitive(this.streamName)
        .image(nodeBufferToTypedArray(data), 'jpg')
        .dimensions(width, height);
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.streamName)
      .category('primitive')
      .type('image');
  }
}

function nodeBufferToTypedArray(buffer) {
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  const typedArray = new Uint8Array(buffer);
  return typedArray;
}
