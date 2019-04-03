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

import {GLTFBuilder} from '@loaders.gl/gltf';
import {toBuffer} from '@loaders.gl/core';
import {DracoEncoder, DracoDecoder} from '@loaders.gl/draco';
import {packBinaryJson} from './xviz-pack-binary';

// 0-frame is an index file for timestamp metadata
// 1-frame is the metadata file for the log
// 2-frame is where the actual XVIZ updates begin
const frameName = index => `${index + 2}-frame`;

// TODO: is this exported for testing
export function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder(options);

  // Pack appropriate large data elements (point clouds and images) in binary
  const packedData = packBinaryJson(xvizJson, gltfBuilder, null, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  gltfBuilder.addApplicationData('xviz', packedData, {nopack: true});

  return gltfBuilder.encodeAsGLB(options);
}

export class XVIZBinaryWriter {
  constructor(sink, options = {}) {
    const {envelope = true, draco = false} = options;
    this.sink = sink;
    this.frameTimings = {
      frames: new Map()
    };
    this.wroteFrameIndex = null;
    this.options = {envelope, draco};
  }

  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizMetadata) {
    this._saveTimestamp(xvizMetadata);

    if (this.options.envelope) {
      xvizMetadata = {type: 'xviz/metadata', data: xvizMetadata};
    }

    const options = {
      flattenArrays: false
    };

    const glbFileBuffer = encodeBinaryXVIZ(xvizMetadata, options);
    this.sink.writeSync(`1-frame.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  }

  writeFrame(frameIndex, xvizFrame) {
    if (this.wroteFrameIndex !== null) {
      throw new Error(
        `writeFrame() was called after writeFrameIndex().  The index was written with last frame of ${frameName(
          this.wroteFrameIndex - 1
        )}`
      );
    }

    this._saveTimestamp(xvizFrame, frameIndex);

    if (this.options.envelope) {
      xvizFrame = {type: 'xviz/state_update', data: xvizFrame};
    }

    const options = {
      flattenArrays: false
    };

    if (this.options.draco) {
      options.DracoEncoder = DracoEncoder;
      options.DracoDecoder = DracoDecoder;
    }

    const glbFileBuffer = encodeBinaryXVIZ(xvizFrame, options);
    this.sink.writeSync(`${frameName(frameIndex)}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  }

  writeFrameIndex() {
    const {startTime, endTime, frames} = this.frameTimings;
    const frameTimings = {};

    if (startTime) {
      frameTimings.startTime = startTime;
    }

    if (endTime) {
      frameTimings.endTime = endTime;
    }

    // Sort frames by index before writing out as an array
    const frameTimes = Array.from(frames.keys()).sort((a, b) => a - b);

    const timing = [];
    frameTimes.forEach((value, index) => {
      // Value is two greater than frame index
      const limit = timing.length;
      if (value > limit) {
        // Adding 2 because 1-frame is metadata file, so frame data starts at 2
        throw new Error(
          `Error writing time index file. Frames are missing between ${limit + 2} and ${value + 2}`
        );
      }

      timing.push(frames.get(value));
    });
    frameTimings.timing = timing;

    this.sink.writeSync('0-frame.json', JSON.stringify(frameTimings));
    this.wroteFrameIndex = timing.length;
  }

  /* eslint-disable camelcase */
  _saveTimestamp(xviz_data, index) {
    const {log_info, updates} = xviz_data;

    if (index === undefined) {
      // Metadata case
      if (log_info) {
        const {start_time, end_time} = log_info || {};
        if (start_time) {
          this.frameTimings.startTime = start_time;
        }

        if (end_time) {
          this.frameTimings.endTime = end_time;
        }
      }
    } else if (updates) {
      if (updates.length === 0 || !updates.every(update => typeof update.timestamp === 'number')) {
        throw new Error('XVIZ updates did not contain a valid timestamp');
      }

      const min = Math.min(updates.map(update => update.timestamp));
      const max = Math.max(updates.map(update => update.timestamp));

      this.frameTimings.frames.set(index, [min, max, index, frameName(index)]);
    } else {
      // Missing updates & index is invalid call
      throw new Error('Cannot find timestamp');
    }
  }
  /* eslint-enable camelcase */
}
