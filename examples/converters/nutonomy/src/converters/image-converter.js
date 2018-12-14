import path from 'path';

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
    const {maxWidth, maxHeight} = this.options;
    const {data, width, height} = await resizeImage(filepath, maxWidth, maxHeight);

    return {data, width, height};
  }

  load({frames}) {
    this.frames = frames;

    this.cameraFilePathByToken = toMap(frames, 'token', frame => {
      const substrings = frame.sensors[this.camera].filename.split('/');
      const filename = substrings[substrings.length - 1];
      return path.join(this.rootDir, this.camera, filename);
    });
  }

  async convertFrame(frameIndex, xvizBuilder) {
    const frameToken = this.frames[frameIndex].token;
    const {data, width, height} = await this.loadFrame(frameToken);

    xvizBuilder
      .primitive(this.streamName)
      .image(nodeBufferToTypedArray(data), 'jpg')
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
