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

import {encodeGLB} from '../glb-loader';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

export function encodeBinaryXVIZ(inputJson, options) {
  // For better compabitility with glTF, we put all XVIZ data in a subfield.
  const json = {
    xviz: inputJson
  };

  const newOptions = Object.assign({magic: MAGIC_XVIZ}, options);

  return encodeGLB(json, newOptions);
}

export function writeBinaryXVIZtoFile(filePath, json, options) {
  const glbFileBuffer = encodeBinaryXVIZ(json, options);
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
