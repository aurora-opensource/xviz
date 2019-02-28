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
import {LOG_STREAM_MESSAGE} from '../constants';
import {parseBinaryXVIZ, isBinaryXVIZ} from '../loaders/xviz-loader/xviz-binary-loader';
import {parseLogMetadata} from './parse-log-metadata';
import {parseStreamVideoMessage} from './parse-stream-video-message';
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

const XVIZ_TYPE_PATTERN = /"type":\s*"xviz\//;

// returns true if the input represents an enveloped XVIZ object as a JSON string.
// Can be either string or Uint8Array
function isXVIZJSONString(str) {
  // {"type":"xviz/
  let firstChunk = str.slice(0, 14);
  // "type":"xviz/*"}
  let lastChunk = str.slice(-36);

  if (Number.isFinite(firstChunk[0])) {
    firstChunk = String.fromCharCode.apply(null, firstChunk);
    lastChunk = String.fromCharCode.apply(null, lastChunk);
  }

  return XVIZ_TYPE_PATTERN.test(firstChunk) || XVIZ_TYPE_PATTERN.test(lastChunk);
}

function getDataType(data) {
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
  switch (getDataType(data)) {
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
// Returns true for the following formats: XVIZ binary (GLB), eveloped JSON object,
// eveloped JSON string, eveloped JSON string as arraybuffer
export function isXVIZMessage(data) {
  switch (getDataType(data)) {
    case 'binary':
      if (isBinaryXVIZ(data)) {
        return true;
      }
      if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
      }
      return isXVIZJSONString(data);

    case 'string':
      return isXVIZJSONString(data);

    case 'object':
      return data.type ? data.type.startsWith('xviz/') : false;

    default:
  }
  return false;
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
export function parseStreamDataMessage(message, onResult, onError, opts) {
  // TODO(twojtasz): better message dispatching
  // here, not all arraybuffer may be image (packed point cloud)
  // TODO(jlisee): Node.js support for blobs for better unit testing
  if (typeof Blob !== 'undefined' && message instanceof Blob) {
    parseStreamVideoMessage(message, onResult, onError);
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
      const result = parseStreamLogData(data, {...opts, v2Type});
      onResult(result);
    }
  } catch (error) {
    onError(error);
  }
}

export function parseStreamLogData(data, opts = {}) {
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
        type: LOG_STREAM_MESSAGE.METADATA
      };
    case 'transform_log_done':
      return {...data, type: LOG_STREAM_MESSAGE.DONE};
    case 'error':
      return {...data, message: 'Stream server error', type: LOG_STREAM_MESSAGE.ERROR};

    // v1 types
    case 'done':
      return {...data, type: LOG_STREAM_MESSAGE.DONE};
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
