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

/**
 * This file contains parsers for XVIZ log stream protocol.
 * Naming conventions:
  `message` refers to the raw message received via webSocket.onmessage
 * `data` refers to pre-processed data objects (blob, arraybuffer, JSON object)
 */
/* global Blob, Uint8Array */
import {XVIZ_MESSAGE_TYPE} from '../constants';
import {
  parseBinaryXVIZ,
  isBinaryXVIZ,
  getBinaryXVIZJSONBuffer
} from '../loaders/xviz-loader/xviz-binary-loader';
import {parseLogMetadata} from './parse-log-metadata';
import {parseVideoMessageV1} from './parse-video-message-v1';
import {TextDecoder} from '../utils/text-encoding';
import parseTimesliceDataV1 from './parse-timeslice-data-v1';
import parseTimesliceDataV2 from './parse-timeslice-data-v2';
import {getXVIZConfig} from '../config/xviz-config';

// returns true if the input represents a JSON string.
// Can be either string or Uint8Array
function isJSONString(str) {
  let firstChar = str[0];
  let lastChar = str[str.length - 1];

  if (Number.isFinite(firstChar)) {
    firstChar = String.fromCharCode(firstChar);
    lastChar = String.fromCharCode(lastChar);
  }

  return (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']');
}

const XVIZ_TYPE_PATTERN = /"type":\s*"(xviz\/\w*)"/;
const XVIZ_TYPE_VALUE_PATTERN = /xviz\/\w*/;

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

// Returns the XVIZ message 'type' from the input string
// else null if not found.
function getObjectXVIZType(type) {
  const match = type.match(XVIZ_TYPE_VALUE_PATTERN);
  if (match) {
    return match[0];
  }

  return null;
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

function getBinaryXVIZType(arraybuffer) {
  const jsonBuffer = getBinaryXVIZJSONBuffer(arraybuffer);
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

export function getDataFormat(data) {
  if (data === null || data === undefined) {
    return null;
  }
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return 'binary';
  }
  return typeof data;
}

// get JSON from binary
function decode(data, recursive) {
  switch (getDataFormat(data)) {
    case 'binary':
      if (isBinaryXVIZ(data)) {
        return parseBinaryXVIZ(data);
      }
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      }
      if (isJSONString(data)) {
        const jsonString = new TextDecoder('utf8').decode(data);
        return JSON.parse(jsonString);
      }
      break;

    case 'string':
      if (isJSONString(data)) {
        return JSON.parse(data);
      }
      break;

    case 'object':
      if (recursive) {
        for (const key in data) {
          // Only peek one-level deep
          data[key] = decode(data[key], false);
        }
      }
      break;

    default:
  }

  return data;
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
  switch (getDataFormat(data)) {
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
      return data.type ? data.type.startsWith('xviz/') : false;

    default:
  }
  return false;
}

// Efficiently check if an object is a supported XVIZ message, with minimal decoding.
//
// Returns the 'type' for the following formats:
//  - XVIZ binary (GLB)
//  - enveloped JSON object
//  - enveloped JSON string
//  - enveloped JSON string as arraybuffer
//
// else return null
export function getXVIZMessageType(data) {
  switch (getDataFormat(data)) {
    case 'binary':
      if (isBinaryXVIZ(data)) {
        return getBinaryXVIZType(data);
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

// Parse apart the namespace and type for the enveloped data
export function unpackEnvelope(data) {
  const parts = data.type.split('/');
  return {
    namespace: parts[0],
    type: parts.slice(1).join('/'),
    data: data.data
  };
}

// Sniff out whether the JSON data provided is in the XVIZ envelope format
export function isEnvelope(data) {
  return data.type && data.data;
}

// Post processes a stream message to make it easy to use for JavaScript applications
export function parseXVIZMessageSync(message, onResult, onError, opts) {
  // TODO(twojtasz): better message dispatching
  // here, not all arraybuffer may be image (packed point cloud)
  // TODO(jlisee): Node.js support for blobs for better unit testing
  if (typeof Blob !== 'undefined' && message instanceof Blob) {
    parseVideoMessageV1(message, onResult, onError);
    return;
  }

  try {
    let data = decode(message, true);
    let v2Type;
    let parseData = true;
    if (isEnvelope(data)) {
      const unpacked = unpackEnvelope(data);
      if (unpacked.namespace === 'xviz') {
        v2Type = unpacked.type;
        data = unpacked.data;
      } else {
        parseData = false;
      }
    }

    if (parseData) {
      const result = parseXVIZData(data, {...opts, v2Type});
      onResult(result);
    }
  } catch (error) {
    onError(error);
  }
}

export function parseXVIZData(data, opts = {}) {
  // TODO(twojtasz): this data.message is due an
  // uncoordinated change on the XVIZ server, temporary.
  const typeKey = opts.v2Type || data.type || data.message || data.update_type;

  switch (typeKey) {
    case 'state_update':
      return parseTimesliceData(data, opts.convertPrimitive);
    case 'metadata':
      return {
        ...parseLogMetadata(data),
        // ensure application sees the metadata type set to the uppercase version
        type: XVIZ_MESSAGE_TYPE.METADATA
      };
    case 'transform_log_done':
      return {...data, type: XVIZ_MESSAGE_TYPE.DONE};
    case 'error':
      return {...data, message: 'Stream server error', type: XVIZ_MESSAGE_TYPE.ERROR};

    // v1 types
    case 'done':
      return {...data, type: XVIZ_MESSAGE_TYPE.DONE};
    default:
      //  TODO(twojtasz): XVIZ should be tagging this with a type
      return parseTimesliceData(data, opts.convertPrimitive);
  }
}

function parseTimesliceData(data, convertPrimitive) {
  const {currentMajorVersion} = getXVIZConfig();

  return currentMajorVersion === 1
    ? parseTimesliceDataV1(data, convertPrimitive)
    : parseTimesliceDataV2(data, convertPrimitive);
}
