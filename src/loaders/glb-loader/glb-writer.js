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

import GLBContainer from './helpers/glb-container';
import GLBBufferPacker from './helpers/glb-buffer-packer';
import {packJsonArrays} from './helpers/pack-json-arrays';

export function encodeGLB(inputJson, options) {
  const bufferPacker = new GLBBufferPacker();
  const glbJson = packJsonArrays(inputJson, bufferPacker, options);
  // TODO - avoid double array buffer creation
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers();

  Object.assign(glbJson, jsonDescriptors);
  return GLBContainer.createGlbBuffer(glbJson, arrayBuffer, options);
}

export function writeGLBtoFile(filePath, json, options) {
  const glbFileBuffer = encodeGLB(json, options);
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  // console.log(`Wrote ${filePath}.glb`);
  return glbFileBuffer;
}

// Helper methods

// Convert (copy) ArrayBuffer to Buffer
function toBuffer(arrayBuffer) {
  /* global Buffer */
  const buffer = new Buffer(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}
