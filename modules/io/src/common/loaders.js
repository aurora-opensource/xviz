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
/* global Buffer */
import {GLTFParser} from '@loaders.gl/gltf';

import {XVIZ_GLTF_EXTENSION} from './constants';
import {TextDecoder} from './text-encoding';

// XVIZ Type constants
const XVIZ_TYPE_PATTERN = /"type":\s*"(xviz\/\w*)"/;
const XVIZ_TYPE_VALUE_PATTERN = /xviz\/\w*/;

// GLB constants
const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII
const MAGIC_GLTF = 0x676c5446; // glTF in Big-Endian ASCII
const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE
const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

/* Data Format Support */

// expected return value of null | binary | string | object
export function getDataContainer(data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (data instanceof Buffer || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return 'binary';
  }

  // Cover string || object
  return typeof data;
}

/* XVIZ Type Support */

// Returns the XVIZ message 'type' from the input strings
// else null if not found.
function getXVIZType(firstChunk, lastChunk) {
  let result = firstChunk.match(XVIZ_TYPE_PATTERN);
  if (!result && lastChunk) {
    result = lastChunk.match(XVIZ_TYPE_PATTERN);
  }

  if (result) {
    // return the first match group which contains the type
    return result[1];
  }

  return null;
}

/* Envelope Support */

// Sniff out whether the JSON data provided is in the XVIZ envelope format
export function isEnvelope(data) {
  return data.type && data.data;
}

// Parse apart the namespace and type for the enveloped data
export function unpackEnvelope(data) {
  const parts = data.type.split('/');
  return {
    namespace: parts[0],
    type: parts.slice(1).join('/'),
    data: data.data
  };
}

/* Binary Support */

// Check first 4 bytes for a 'magic' value
function checkMagic(glbArrayBuffer, options = {}) {
  const {magic, magicAlt} = options;

  // GLB Header
  const dataView = new DataView(glbArrayBuffer);
  const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').

  return magic1 === magic || (magicAlt && magicAlt === magic1);
}

// Supports GLB format
export function isBinaryXVIZ(arrayBuffer) {
  const isArrayBuffer = arrayBuffer instanceof ArrayBuffer;
  return isArrayBuffer && checkMagic(arrayBuffer, {magic: MAGIC_XVIZ, magicAlt: MAGIC_GLTF});
}

// Supports GLB format
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

/* GLB Support */

export function isGLBXVIZ(arrayBuffer) {
  const isArrayBuffer = arrayBuffer instanceof ArrayBuffer;
  // MAGIC_XVIZ is a deprecated magic header
  return isArrayBuffer && checkMagic(arrayBuffer, {magic: MAGIC_XVIZ, magicAlt: MAGIC_GLTF});
}

function getGLBXVIZType(arraybuffer) {
  const jsonBuffer = getGLBXVIZJSONBuffer(arraybuffer);
  if (!jsonBuffer) {
    return null;
  }

  // We have no choice but to decode the JSON portion of the buffer
  // since it also contains all the GLB headers. This means we do not
  // have any meaningful limits for where to search for the 'type' string
  const textDecoder = new TextDecoder('utf8');
  const jsonString = textDecoder.decode(jsonBuffer);

  return getXVIZType(jsonString);
}

// Mostly taken from @loaders.gltf parse-glb.js, but limited to just getting the json chunk
// as we do not need to parse the binary here.
function getGLBXVIZJSONBuffer(arrayBuffer, byteOffset = 0) {
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

/* JSON Support */

// Return true if the ArrayBuffer represents a JSON string.
//
// Search the first and last 5 entries for evidence of
// being a JSON buffer
function isJSONStringTypeArray(arr) {
  let firstChar = arr.slice(0, 5).find(entry => entry >= 0x20);
  let lastChars = arr.slice(-5);

  // Buffer.slice() does not make a copy, but we need one since
  // we call reverse()
  if (lastChars instanceof Buffer) {
    lastChars = Buffer.from(lastChars);
  }

  let lastChar = lastChars.reverse().find(entry => entry >= 0x20);

  firstChar = String.fromCharCode(firstChar);
  lastChar = String.fromCharCode(lastChar);

  return (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']');
}

// returns true if the input represents a JSON string.
// Can be either string or Uint8Array
//
// Search the first and last 5 entries for evidence of
// being a JSON buffer
export function isJSONString(str) {
  if (str instanceof Uint8Array) {
    return isJSONStringTypeArray(str);
  }

  if (typeof str === 'object') {
    return false;
  }

  const beginning = str.slice(0, 5).trim();
  const end = str.slice(-5).trim();

  return (
    (beginning.startsWith('{') && end.endsWith('}')) ||
    (beginning.startsWith('[') && end.endsWith(']'))
  );
}

// return the XVIZ type string if the input represents an enveloped XVIZ
// object as a JSON string.
// 'str' can be either string or Uint8Array
function getJSONXVIZType(str) {
  // We are trying to capture
  // "type"\s*:\s*"xviz/transform_point_in_time"
  // which the smallest is 37 bytes. Grab 50
  // to provide room for spacing

  // {"type":"xviz/*"
  let firstChunk = str.slice(0, 50);
  // "type":"xviz/*"}
  let lastChunk = str.slice(-50);

  if (Number.isFinite(firstChunk[0])) {
    firstChunk = String.fromCharCode.apply(null, firstChunk);
    lastChunk = String.fromCharCode.apply(null, lastChunk);
  }

  return getXVIZType(firstChunk, lastChunk);
}

/* Javascript Object Support */

// Returns the XVIZ message 'type' from the input string
// else null if not found.
export function getObjectXVIZType(type) {
  const match = type.match(XVIZ_TYPE_VALUE_PATTERN);
  if (match) {
    return match[0];
  }

  return null;
}

/* General XVIZ Message Support */

// Efficiently check if an object is a supported XVIZ message, with minimal decoding.
//
// Returns the 'type' for the following formats:
// - XVIZ binary (GLB)
// - enveloped JSON object
// - enveloped JSON string
// - enveloped JSON string as arraybuffer
//
// else return null
export function getXVIZMessageType(data) {
  switch (getDataContainer(data)) {
    case 'binary':
      if (isGLBXVIZ(data)) {
        return getGLBXVIZType(data);
      }
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      }
      return getJSONXVIZType(data);

    case 'string':
      return getJSONXVIZType(data);

    case 'object':
      return data.type ? getObjectXVIZType(data.type) : null;

    default:
  }
  return null;
}

// Efficiently check if an object is a supported XVIZ message, without decoding it.
//
// Returns true for the following formats:
// - XVIZ binary (GLB)
// - enveloped JSON object,
// - enveloped JSON string
// - enveloped JSON string as arraybuffer
//
// else return false
export function isXVIZMessage(data) {
  switch (getDataContainer(data)) {
    case 'binary':
      if (isBinaryXVIZ(data)) {
        return true;
      }
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      }
      return getJSONXVIZType(data) !== null;

    case 'string':
      return getJSONXVIZType(data) !== null;

    case 'object':
      return data.type ? getObjectXVIZType(data.type) !== null : false;

    default:
  }
  return false;
}
