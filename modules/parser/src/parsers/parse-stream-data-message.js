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

// if the first Char and lastChar represents json
function isParsable(firstChar, lastChar) {
  return (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']');
}

// if the string can be sent to JSON.parse
function isJSONString(str) {
  return isParsable(str[0], str[str.length - 1]);
}

// encodedString is the Uint8Array, if it can be sent to string format.
function isJSON(encodedString) {
  const firstChar = String.fromCharCode(encodedString[0]);
  const lastChar = String.fromCharCode(encodedString[encodedString.length - 1]);
  return isParsable(firstChar, lastChar);
}

// get JSON from binary
function decode(data, recursive) {
  if (!data) {
    // ignore
  } else if (isBinaryXVIZ(data)) {
    return parseBinaryXVIZ(data);
  } else if (data instanceof Uint8Array && isJSON(data)) {
    const jsonString = new TextDecoder('utf8').decode(data);
    return JSON.parse(jsonString);
  } else if (typeof data === 'string' && isJSONString(data)) {
    return JSON.parse(data);
  } else if (recursive && typeof data === 'object') {
    for (const key in data) {
      // Only peek one-level deep
      data[key] = decode(data[key], false);
    }
  }
  return data;
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
