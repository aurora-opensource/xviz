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

import {GLTFParser} from '@loaders.gl/gltf';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII
const MAGIC_GLTF = 0x676c5446; // glTF in Big-Endian ASCII
const BE = false; // Magic needs to be written as BE

export function parseBinaryXVIZ(arrayBuffer) {
  const gltfParser = new GLTFParser(arrayBuffer);
  gltfParser.parse({magic: MAGIC_XVIZ});

  // TODO/ib - the following options would break backwards compatibility
  // return gltfParser.getExtras('xviz')
  // return gltfParser.getExtension('UBER_xviz');

  // TODO/ib - Fix when loaders.gl API is fixed
  return gltfParser.getApplicationData('xviz');
}

export function isBinaryXVIZ(arrayBuffer) {
  const isArrayBuffer = arrayBuffer instanceof ArrayBuffer;
  return isArrayBuffer && isGLB(arrayBuffer, {magic: MAGIC_XVIZ});
}

// TODO - Replace with GLBParser.isGLB()
function isGLB(glbArrayBuffer, options = {}) {
  const {magic = MAGIC_GLTF} = options;

  // GLB Header
  const dataView = new DataView(glbArrayBuffer);
  const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').

  return magic1 === magic || magic1 === MAGIC_GLTF;
}
