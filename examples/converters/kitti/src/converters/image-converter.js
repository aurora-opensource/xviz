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

  async loadFrame(frameNumber) {
    // Load the data for this frame
    const fileName = this.fileNames[frameNumber];
    const {maxWidth, maxHeight} = this.options;
    const srcFilePath = path.join(this.dataDir, fileName);
    const {data, width, height} = await resizeImage(srcFilePath, maxWidth, maxHeight);

    // Get the time stamp
    const timestamp = this.timestamps[frameNumber];

    return {data, timestamp, width, height};
  }

  async convertFrame(frameNumber, xvizBuilder) {
    const {data, width, height} = await this.loadFrame(frameNumber);

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
