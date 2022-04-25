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
/* eslint-disable camelcase, max-statements */
import {copyToArray} from '@loaders.gl/loader-utils';
import {isImage} from '@loaders.gl/images';
import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-utils/gltf-utils';
import {padTo4Bytes} from './memory-copy-utils';
import encodeGLBSync from './encode-glb';
import {packBinaryJson} from '../writers/xviz-pack-binary';

export default class GLBBuilder {
  constructor(options = {}) {
    // Lets us keep track of how large the body will be, as well as the offset for each of the
    // original buffers.
    this.byteLength = 0;

    this.json = {
      buffers: [
        {
          // Just the single BIN chunk buffer
          byteLength: 0 // Updated at end of conversion
        }
      ],
      bufferViews: [],
      accessors: [],
      images: [],
      meshes: []
    };

    // list of binary buffers to be written to the BIN chunk
    // (Each call to addBuffer, addImage etc adds an entry here)
    this.sourceBuffers = [];

    this.log = options.log || console; // eslint-disable-line
  }

  // ACCESSORS

  getByteLength() {
    return this.byteLength;
  }

  // Checks if a binary buffer is a recognized image format (PNG, JPG, GIF, ...)
  isImage(imageData) {
    return isImage(imageData);
  }

  // MODIFERS
  encodeSync(options = {}) {
    return this.encodeAsGLB(options);
  }

  // Encode the full glTF file as a binary GLB file
  // Returns an ArrayBuffer that represents the complete GLB image that can be saved to file
  // Encode the full GLB buffer with header etc
  // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#
  // glb-file-format-specification
  encodeAsGLB(options = {}) {
    // TODO - avoid double array buffer creation
    this._packBinaryChunk();

    if (options.magic) {
      console.warn('Custom glTF magic number no longer supported'); // eslint-disable-line
    }

    const glb = {
      version: 2,
      json: this.json,
      binary: this.arrayBuffer
    };

    // Calculate length and allocate buffer
    const byteLength = encodeGLBSync(glb, null, 0, options);
    const glbArrayBuffer = new ArrayBuffer(byteLength);

    // Encode into buffer
    const dataView = new DataView(glbArrayBuffer);
    encodeGLBSync(glb, dataView, 0, options);

    return glbArrayBuffer;
  }

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data, packOptions = {}) {
    const jsonData = packOptions.nopack ? data : packBinaryJson(data, this, null, packOptions);
    this.json[key] = jsonData;
    return this;
  }

  // Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes buffers as glTF accessors, but this could be optimized
  addBuffer(sourceBuffer, accessor = {size: 3}) {
    const bufferViewIndex = this.addBufferView(sourceBuffer);

    const accessorDefaults = {
      size: accessor.size,
      componentType: getComponentTypeFromArray(sourceBuffer),
      count: Math.round(sourceBuffer.length / accessor.size)
    };

    return this.addAccessor(bufferViewIndex, Object.assign(accessorDefaults, accessor));
  }

  // Basic glTF adders: basic memory buffer/image type fields
  // Scenegraph specific adders are placed in glTFBuilder
  // TODO: These should be moved to glTFBuilder once addBuffer
  // have been rewritten to not depend on these.

  // Add one untyped source buffer, create a matching glTF `bufferView`, and return its index
  addBufferView(buffer) {
    const byteLength = buffer.byteLength || buffer.length;

    // Add a bufferView indicating start and length of this binary sub-chunk
    this.json.bufferViews.push({
      buffer: 0,
      // Write offset from the start of the binary body
      byteOffset: this.byteLength,
      byteLength
    });

    // We've now written the contents to the body, so update the total length
    // Every sub-chunk needs to be 4-byte aligned
    this.byteLength += padTo4Bytes(byteLength);

    // Add this buffer to the list of buffers to be written to the body.
    this.sourceBuffers.push(buffer);

    // Return the index to the just created bufferView
    return this.json.bufferViews.length - 1;
  }

  // Adds an accessor to a bufferView
  addAccessor(bufferViewIndex, accessor) {
    // Add an accessor pointing to the new buffer view
    this.json.accessors.push({
      bufferView: bufferViewIndex,
      type: getAccessorTypeFromSize(accessor.size),
      componentType: accessor.componentType,
      count: accessor.count
    });

    return this.json.accessors.length - 1;
  }

  // PRIVATE

  // For testing
  _pack() {
    this._packBinaryChunk();
    return {arrayBuffer: this.arrayBuffer, json: this.json};
  }

  // Pack the binary chunk
  _packBinaryChunk() {
    // Already packed
    if (this.arrayBuffer) {
      return;
    }

    // Allocate total array
    const totalByteLength = this.byteLength;
    const arrayBuffer = new ArrayBuffer(totalByteLength);
    const targetArray = new Uint8Array(arrayBuffer);

    // Copy each array into
    let dstByteOffset = 0;
    for (let i = 0; i < this.sourceBuffers.length; i++) {
      const sourceBuffer = this.sourceBuffers[i];
      dstByteOffset = copyToArray(sourceBuffer, targetArray, dstByteOffset);
    }

    // Update the glTF BIN CHUNK byte length
    this.json.buffers[0].byteLength = totalByteLength;

    // Save generated arrayBuffer
    this.arrayBuffer = arrayBuffer;

    // Clear out sourceBuffers
    this.sourceBuffers = [];
  }

  // Report internal buffer sizes for debug and testing purposes
  _getInternalCounts() {
    return {
      buffers: this.json.buffers.length,
      bufferViews: this.json.bufferViews.length,
      accessors: this.json.accessors.length,
      images: this.json.images.length
    };
  }
}
