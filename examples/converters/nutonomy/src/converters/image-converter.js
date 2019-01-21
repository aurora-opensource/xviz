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

  async convertFrame(frameIndex, xvizBuilder) {
    const frameToken = this.frames[frameIndex].token;
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
