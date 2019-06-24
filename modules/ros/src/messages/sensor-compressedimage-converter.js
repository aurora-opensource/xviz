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
import Converter from './converter';

export class SensorCompressedImage extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'SensorCompressedImage';
  }

  static get messageType() {
    return 'sensor_msgs/CompressedImage';
  }

  async convertMessage(frame, xvizBuilder) {
    const msgs = frame[this.topic];
    if (!msgs) {
      return;
    }

    if (msgs.length) {
      const {message} = msgs[msgs.length - 1];
      const {format, data} = message;

      xvizBuilder.primitive(this.xvizStream).image(nodeBufferToTypedArray(data), format);
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
  // TODO - per docs we should just be able to call buffer.buffer, but there are issues
  const typedArray = new Uint8Array(buffer);
  return typedArray;
}
