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

import '@loaders.gl/polyfills';
import {XVIZBaseWriter} from './xviz-base-writer';
import {GLTFBuilder} from '@loaders.gl/gltf';
import {packBinaryJson} from './xviz-pack-binary';
import {XVIZEnvelope, XVIZ_GLTF_EXTENSION} from '@xviz/io';

// Convert (copy) ArrayBuffer to Buffer
// This is from @loaders.gl/core/src/node/utils/to-buffer.node.js
// but the function is no longer exported
function toBuffer(binaryData) {
  if (ArrayBuffer.isView(binaryData)) {
    binaryData = binaryData.buffer;
  }

  if (typeof Buffer !== 'undefined' && binaryData instanceof ArrayBuffer) {
    /* global Buffer */
    const buffer = new Buffer(binaryData.byteLength);
    const view = new Uint8Array(binaryData);
    for (let i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
    }
    return buffer;
  }

  throw new Error('Failed to convert to buffer');
}

// 0-frame is an index file for timestamp metadata
// 1-frame is the metadata file for the log
// 2-frame is where the actual XVIZ updates begin
const messageName = index => `${index + 2}-frame`;

export function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder(options);

  // Pack appropriate large data elements (point clouds and images) in binary
  const packedData = packBinaryJson(xvizJson, gltfBuilder, null, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  const {useAVSXVIZExtension} = options;
  if (useAVSXVIZExtension === true) {
    gltfBuilder.addExtension(XVIZ_GLTF_EXTENSION, packedData, {nopack: true});
  } else {
    gltfBuilder.addApplicationData('xviz', packedData, {nopack: true});
  }

  return gltfBuilder.encodeAsGLB(options);
}

export class XVIZBinaryWriter extends XVIZBaseWriter {
  constructor(sink, options = {}) {
    super(sink);

    const {envelope = true, flattenArrays = true, DracoWriter, DracoLoader} = options;
    this.messageTimings = {
      messages: new Map()
    };
    this.wroteMessageIndex = null;
    this.options = {envelope, flattenArrays, DracoWriter, DracoLoader};

    this.encodingOptions = {
      flattenArrays: this.options.flattenArrays
    };

    if (this.options.DracoWriter) {
      this.encodingOptions.DracoWriter = DracoWriter;
    }

    if (this.options.DracoLoader) {
      this.encodingOptions.DracoLoader = DracoLoader;
    }
  }

  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizMetadata) {
    this._checkValid();
    this._saveTimestamp(xvizMetadata);

    if (this.options.envelope) {
      xvizMetadata = XVIZEnvelope.Metadata(xvizMetadata);
    }

    const glbFileBuffer = encodeBinaryXVIZ(xvizMetadata, this.encodingOptions);
    this.sink.writeSync(`1-frame.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  }

  writeMessage(messageIndex, xvizMessage) {
    this._checkValid();
    this._saveTimestamp(xvizMessage, messageIndex);

    if (this.options.envelope) {
      xvizMessage = XVIZEnvelope.StateUpdate(xvizMessage);
    }

    const glbFileBuffer = encodeBinaryXVIZ(xvizMessage, this.encodingOptions);
    this.sink.writeSync(`${messageName(messageIndex)}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  }

  _writeMessageIndex() {
    this._checkValid();
    const {startTime, endTime, messages} = this.messageTimings;
    const messageTimings = {};

    if (startTime) {
      messageTimings.startTime = startTime;
    }

    if (endTime) {
      messageTimings.endTime = endTime;
    }

    // Sort messages by index before writing out as an array
    const messageTimes = Array.from(messages.keys()).sort((a, b) => a - b);

    const timing = [];
    messageTimes.forEach((value, index) => {
      // Value is two greater than message index
      const limit = timing.length;
      if (value > limit) {
        // Adding 2 because 1-frame is metadata file, so message data starts at 2
        throw new Error(
          `Error writing time index file. Messages are missing between ${limit + 2} and ${value +
            2}`
        );
      }

      timing.push(messages.get(value));
    });
    messageTimings.timing = timing;

    this.sink.writeSync('0-frame.json', JSON.stringify(messageTimings));
    this.wroteMessageIndex = timing.length;
  }

  close() {
    if (this.sink) {
      if (!this.wroteMessageIndex) {
        this._writeMessageIndex();
      }

      super.close();
    }
  }

  /* eslint-disable camelcase */
  _saveTimestamp(xviz_data, index) {
    const {log_info, updates} = xviz_data;

    if (index === undefined) {
      // Metadata case
      if (log_info) {
        const {start_time, end_time} = log_info || {};
        if (start_time) {
          this.messageTimings.startTime = start_time;
        }

        if (end_time) {
          this.messageTimings.endTime = end_time;
        }
      }
    } else if (updates) {
      if (updates.length === 0 || !updates.every(update => typeof update.timestamp === 'number')) {
        throw new Error('XVIZ updates did not contain a valid timestamp');
      }

      const min = Math.min(updates.map(update => update.timestamp));
      const max = Math.max(updates.map(update => update.timestamp));

      this.messageTimings.messages.set(index, [min, max, index, messageName(index)]);
    } else {
      // Missing updates & index is invalid call
      throw new Error('Cannot find timestamp');
    }
  }
  /* eslint-enable camelcase */
}
