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
/* global TextDecoder */
/* eslint-disable camelcase, max-statements */
import '../common/text-encoding';
import {assert} from '@loaders.gl/loader-utils';
import {padTo4Bytes} from './memory-copy-utils';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4e4f534a;
const GLB_CHUNK_TYPE_BIN = 0x004e4942;

const LE = true; // Binary GLTF is little endian.

function getMagicString(dataView, byteOffset = 0) {
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}

// Check if a data view is a GLB
export function isGLB(arrayBuffer, byteOffset = 0, options = {}) {
  const dataView = new DataView(arrayBuffer);
  // Check that GLB Header starts with the magic number
  const {magic = MAGIC_glTF} = options;
  const magic1 = dataView.getUint32(byteOffset, false);
  return magic1 === magic || magic1 === MAGIC_glTF;
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification

// Compare with GLB loader documentation
/*
Returns {
  header: {
    type: string,
    magic: number,
    byteLength: number,
    byteOffset: number
  },

  version: number,

  // JSON Chunk
  json: any,

  // BIN Chunk
  hasBinChunk: boolean,
  binChunks: [{
    arrayBuffer,
    byteOffset,
    byteLength
  }],

  // Deprecated (duplicates header)
  type: string,
  magic: number,
  version: number,
  byteLength: number,
  byteOffset: number,
  binChunkByteOffset: number,
  binChunkLength: number
}
*/

export default function parseGLBSync(glb, arrayBuffer, byteOffset = 0, options = {}) {
  // Check that GLB Header starts with the magic number
  const dataView = new DataView(arrayBuffer);

  glb.type = getMagicString(dataView, byteOffset + 0);
  glb.version = dataView.getUint32(byteOffset + 4, LE); // Version 2 of binary glTF container format
  const byteLength = dataView.getUint32(byteOffset + 8, LE); // Total byte length of generated file

  // Less important stuff in a header
  glb.header = {
    byteOffset, // Byte offset into the initial arrayBuffer
    byteLength
  };

  if (glb.type !== 'glTF') {
    console.warn(`Invalid GLB magic string ${glb.type}`); // eslint-disable-line
  }

  assert(glb.version === 2, `Invalid GLB version ${glb.version}. Only .glb v2 supported`);
  assert(glb.header.byteLength > GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE);

  // Per spec we must iterate over chunks, ignoring all except JSON and BIN
  glb.json = {};
  glb.hasBinChunk = false;
  glb.binChunks = [];

  parseGLBChunksSync(glb, dataView, byteOffset + 12, options);

  // DEPRECATED - duplicate header fields in root of returned object
  addDeprecatedFields(glb);

  return byteOffset + glb.header.byteLength;
}

function parseGLBChunksSync(glb, dataView, byteOffset, options) {
  // Iterate as long as there is space left for another chunk header
  while (byteOffset + 8 <= glb.header.byteLength) {
    const chunkLength = dataView.getUint32(byteOffset + 0, LE); // Byte length of chunk
    const chunkFormat = dataView.getUint32(byteOffset + 4, LE); // Chunk format as uint32
    byteOffset += GLB_CHUNK_HEADER_SIZE;

    // Per spec we must iterate over chunks, ignoring all except JSON and BIN
    switch (chunkFormat) {
      case GLB_CHUNK_TYPE_JSON:
        parseJSONChunk(glb, dataView, byteOffset, chunkLength, options);
        break;
      case GLB_CHUNK_TYPE_BIN:
        parseBINChunk(glb, dataView, byteOffset, chunkLength, options);
        break;
      default:
        // Ignore, per spec
        // console.warn(`Unknown GLB chunk type`); // eslint-disable-line
        break;
    }

    // DEPRECATED - Backward compatibility for very old xviz files
    switch (chunkFormat) {
      case 0:
        if (!options.strict) {
          parseJSONChunk(glb, dataView, byteOffset, chunkLength, options);
        }
        break;
      case 1:
        if (!options.strict) {
          parseBINChunk(glb, dataView, byteOffset, chunkLength, options);
        }
        break;
      default:
    }

    byteOffset += padTo4Bytes(chunkLength);
  }

  return byteOffset;
}

// Parse a GLB JSON chunk
function parseJSONChunk(glb, dataView, byteOffset, chunkLength, options) {
  // 1. Create a "view" of the binary encoded JSON data inside the GLB
  const jsonChunk = new Uint8Array(dataView.buffer, byteOffset, chunkLength);

  // 2. Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);

  // 3. Parse the JSON text into a JavaScript data structure
  glb.json = JSON.parse(jsonText);
}

// Parse a GLB BIN chunk
function parseBINChunk(glb, dataView, byteOffset, chunkLength, options) {
  // Note: BIN chunk can be optional
  glb.header.hasBinChunk = true;
  glb.binChunks.push({
    byteOffset,
    byteLength: chunkLength,
    arrayBuffer: dataView.buffer
    // TODO - copy, or create typed array view?
  });
}

function addDeprecatedFields(glb) {
  glb.byteOffset = glb.header.byteOffset;
  glb.magic = glb.header.magic;
  glb.version = glb.header.version;
  glb.byteLength = glb.header.byteLength;
  glb.hasBinChunk = glb.binChunks.length >= 1;
  glb.binChunkByteOffset = glb.header.hasBinChunk ? glb.binChunks[0].byteOffset : 0;
  glb.binChunkLength = glb.header.hasBinChunk ? glb.binChunks[0].byteLength : 0;
}
