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
/* global Blob */
import {XVIZ_MESSAGE_TYPE} from '../constants';
import {XVIZData} from '@xviz/io';
import {parseLogMetadata} from './parse-log-metadata';
import {parseVideoMessageV1} from './parse-video-message-v1';
import parseTimesliceDataV1 from './parse-timeslice-data-v1';
import parseTimesliceDataV2 from './parse-timeslice-data-v2';
import {getXVIZConfig} from '../config/xviz-config';

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
    const xvizData = new XVIZData(message);
    const xvizMsg = xvizData.message();

    // Non-xviz messages will return null
    if (xvizMsg) {
      const data = xvizMsg.data;

      const v2Type = xvizMsg.type || undefined;

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
