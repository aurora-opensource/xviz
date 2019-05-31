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

import {XVIZ_GLTF_EXTENSION} from '../../constants';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII
const MAGIC_GLTF = 0x676c5446; // glTF in Big-Endian ASCII
const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE
const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

export function parseBinaryXVIZ(arrayBuffer) {
  const gltfParser = new GLTFParser();
  gltfParser.parse(arrayBuffer, {createImages: false});

  // TODO/ib - Fix when loaders.gl API is fixed
  let xviz = gltfParser.getApplicationData('xviz');

  if (xviz === undefined) {
    xviz = gltfParser.getExtension(XVIZ_GLTF_EXTENSION);
  }

  return xviz;
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

// TODO(twojtasz): We need @loaders.gl/gltf to expose parseGLB which
//                 does not unpack the binary buffers as we only need the JSON
//                 to determine the type
//
// mostly taken from parse-glb.js, but limited to just getting the json chunk
export function getBinaryXVIZJSONBuffer(arrayBuffer, byteOffset = 0) {
  // GLB Header
  const dataView = new DataView(arrayBuffer);
  const glb = {};

  glb.byteOffset = byteOffset; // Byte offset into the initial arrayBuffer

  // GLB Header
  glb.magic = dataView.getUint32(byteOffset + 0, BE); // Magic number (the ASCII string 'glTF').
  glb.version = dataView.getUint32(byteOffset + 4, LE); // Version 2 of binary glTF container format
  glb.byteLength = dataView.getUint32(byteOffset + 8, LE); // Total byte length of generated file

  if (glb.version !== 2 || glb.byteLength < 20) {
    return null;
  }

  glb.jsonChunkLength = dataView.getUint32(byteOffset + 12, LE); // Byte length of json chunk
  glb.jsonChunkFormat = dataView.getUint32(byteOffset + 16, LE); // Chunk format as uint32

  const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
  const isJSONChunk = glb.jsonChunkFormat === GLB_CHUNK_TYPE_JSON || glb.jsonChunkFormat === 0;

  if (!isJSONChunk) {
    // JSON should be first and present
    return null;
  }

  glb.jsonChunkByteOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes
  return new Uint8Array(arrayBuffer, byteOffset + glb.jsonChunkByteOffset, glb.jsonChunkLength);
}
