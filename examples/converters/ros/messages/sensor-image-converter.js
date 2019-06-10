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
import {Converter} from '@xviz/ros';
import sharp from 'sharp';

import fs from 'fs';
let imgCount = 0;

export class SensorImage extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'SensorImage';
  }

  static get messageType() {
    return 'sensor_msgs/Image';
  }

  convertYUVtoRGB(y, u, v) {
    let r,g,b;
    
    // u and v are +-0.5
    u -= 128;
    v -= 128;

    // Conversion
    r = y + 1.370705 * v;
    g = y - 0.698001 * v - 0.337633 * u;
    b = y + 1.732446 * u;

    // Clamp to 0..1
    if (r < 0) r = 0;
    if (g < 0) g = 0;
    if (b < 0) b = 0;
    if (r > 255) r = 255;
    if (g > 255) g = 255;
    if (b > 255) b = 255;

    return {r, g, b};
  }

  convertImageYUVtoRGB({width, height, step, data}) {
    const buffer = Buffer.alloc(width * height * 3);
    let bIndex = 0;

    for (let row=0; row < height; row += 1) {
      const offset = row * step;
      for (let col=0; col < width; col += 2, bIndex += 6) {
        /// get YUV bytes
        const u = data[offset + col];
        const y1 = data[offset + col + 1];
        const v = data[offset + col + 2];
        const y2 = data[offset + col + 3];
        let p = this.convertYUVtoRGB(y1, u, v);

        /// convert to RGB and copy to canvas buffer
        buffer[bIndex]     = p.r;
        buffer[bIndex + 1] = p.g;
        buffer[bIndex + 2] = p.b;

        p = this.convertYUVtoRGB(y2, u, v);
        buffer[bIndex + 3] = p.r;
        buffer[bIndex + 4] = p.g;
        buffer[bIndex + 5] = p.b;
      }
    }
    return buffer;
  }

  async convertMessage(frame, xvizBuilder) {
    const msgs = frame[this.topic];
    if (!msgs) {
      return;
    }

    if (msgs.length) {
      const {message} = msgs[msgs.length - 1];
      const {width, height, encoding, step, data} = message;

      if (encoding !== 'yuv422') {
        console.log('Expected image format "yuv422"');
        return;
      }

      const rgbBuf = this.convertImageYUVtoRGB({width, height, step, data});

      const imgData = await sharp(rgbBuf, {
        raw: {
          width,
          height,
          channels: 3
        }
      })
        .toFormat('png')
        .toBuffer();

      /*
      fs.writeFileSync(`yuv422-${imgCount}.png`, imgData);
      imgCount += 1;
      */

      const img = nodeBufferToTypedArray(imgData);
      xvizBuilder
        .primitive(this.xvizStream)
        .image(img)
        .dimensions(width, height);
    }
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.xvizStream)
      .category('primitive')
      .type('image');
  }
}

function nodeBufferToTypedArray(buffer) {
  const typedArray = new Uint8Array(buffer);
  return typedArray;
}
