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
/* eslint-disable camelcase, max-statements, no-restricted-globals, no-redeclare */
import {assert} from './assert';
import parseGLBSync, {isGLB} from './parse-glb';
import {
  ATTRIBUTE_TYPE_TO_COMPONENTS,
  ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE,
  ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY
} from './gltf-utils/gltf-utils';
import unpackBinaryJson from './packed-json/unpack-binary-json';
import unpackGLTFBuffers from './packed-json/unpack-gltf-buffers';

export default class GLBParser {
  static isGLB(arrayBuffer, options = {}) {
    const byteOffset = 0;
    return isGLB(arrayBuffer, byteOffset);
  }

  // Return the gltf JSON and the original arrayBuffer
  parse(arrayBuffer, options = {}) {
    return this.parseSync(arrayBuffer, options);
  }

  parseSync(arrayBuffer, options = {}) {
    this.glbArrayBuffer = arrayBuffer;

    this.binaryByteOffset = null;
    this.packedJson = null;
    this.json = null;

    // Only parse once
    if (this.json === null && this.binaryByteOffset === null) {
      const byteOffset = 0;

      // Populates the supplied object (`this`) with parsed data members.
      parseGLBSync(this, this.glbArrayBuffer, byteOffset, options);

      // Backwards compat
      this.binaryByteOffset = this.binChunkByteOffset;

      // Unpack binary JSON
      this.packedJson = this.json;

      const unpackedBuffers = unpackGLTFBuffers(
        this.glbArrayBuffer,
        this.json,
        this.binaryByteOffset
      );
      this.json = unpackBinaryJson(this.json, unpackedBuffers);

      this.unpackedBuffers = unpackedBuffers;
    }

    return this;
  }

  // Returns application JSON data stored in `key`
  getApplicationData(key) {
    if (this.json) {
      return this.json[key];
    }

    return null;
  }

  // Returns JSON envelope
  getJSON() {
    return this.json;
  }

  // Return binary chunk
  getArrayBuffer() {
    return this.glbArrayBuffer;
  }

  // Return index into binary chunk
  getBinaryByteOffset() {
    return this.binaryByteOffset;
  }

  // Unpacks a bufferview into a new Uint8Array that is a view into the binary chunk
  getBufferView(glTFBufferView) {
    const byteOffset = (glTFBufferView.byteOffset || 0) + this.binaryByteOffset;
    return new Uint8Array(this.glbArrayBuffer, byteOffset, glTFBufferView.byteLength);
  }

  // Unpacks a glTF accessor into a new typed array that is a view into the binary chunk
  getBuffer(glTFAccessor) {
    // Decode the glTF accessor format
    const ArrayType = ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY[glTFAccessor.componentType];
    const components = ATTRIBUTE_TYPE_TO_COMPONENTS[glTFAccessor.type];
    const bytesPerComponent = ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE[glTFAccessor.componentType];
    const length = glTFAccessor.count * components;
    const byteLength = glTFAccessor.count * components * bytesPerComponent;

    // Get the boundaries of the binary sub-chunk for this bufferView
    const glTFBufferView = this.json.bufferViews[glTFAccessor.bufferView];
    assert(byteLength >= 0 && glTFAccessor.byteOffset + byteLength <= glTFBufferView.byteLength);

    const byteOffset = glTFBufferView.byteOffset + this.binaryByteOffset + glTFAccessor.byteOffset;
    return new ArrayType(this.glbArrayBuffer, byteOffset, length);
  }

  // Unpacks an image into an HTML image
  getImageData(glTFImage) {
    return {
      typedArray: this.getBufferView(glTFImage.bufferView),
      mimeType: glTFImage.mimeType || 'image/jpeg'
    };
  }

  getImage(glTFImage) {
    /* global self, Blob, Image */
    const arrayBufferView = this.getBufferView(glTFImage.bufferView);
    const mimeType = glTFImage.mimeType || 'image/jpeg';
    const blob = new Blob([arrayBufferView], {type: mimeType});
    const urlCreator = self.URL || self.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    const img = new Image();
    img.src = imageUrl;
    return img;
  }

  getImageAsync(glTFImage) {
    /* global self, Blob, Image */
    return new Promise(resolve => {
      const arrayBufferView = this.getBufferView(glTFImage.bufferView);
      const mimeType = glTFImage.mimeType || 'image/jpeg';
      const blob = new Blob([arrayBufferView], {type: mimeType});
      const urlCreator = self.URL || self.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = imageUrl;
    });
  }
}
