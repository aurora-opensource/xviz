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

import {resizeImage} from '../parsers/process-image';
import BaseConverter from './base-converter';

export default class ImageConverter extends BaseConverter {
  constructor(rootDir, camera = 'image_00', options) {
    super(rootDir, camera);

    this.streamName = `/camera/${camera}`;
    this.dataDir = path.join(this.streamDir, 'data');

    this.options = options;
  }

  async loadMessage(messageNumber) {
    // Load the data for this message
    const fileName = this.fileNames[messageNumber];
    const {maxWidth, maxHeight} = this.options;
    const srcFilePath = path.join(this.dataDir, fileName);
    const {data, width, height} = await resizeImage(srcFilePath, maxWidth, maxHeight);

    // Get the time stamp
    const timestamp = this.timestamps[messageNumber];

    return {data, timestamp, width, height};
  }

  async convertMessage(messageNumber, xvizBuilder) {
    const {data, width, height} = await this.loadMessage(messageNumber);

    xvizBuilder
      .primitive(this.streamName)
      .image(nodeBufferToTypedArray(data), 'png')
      .dimensions(width, height);
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
