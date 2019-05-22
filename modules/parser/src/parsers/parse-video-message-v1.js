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
 * This file contains parsers for XVIZ video stream protocol.
 * Naming conventions:
 * `message` refers to the raw message received via webSocket.onmessage
 * `data` refers to pre-processed data objects (blob, arraybuffer, JSON object)
 */
/* global Blob */
import {XVIZ_MESSAGE_TYPE} from '../constants';
import {TextDecoder} from '../utils/text-encoding';
import {blobToArrayBuffer} from '../utils/binary';

import {parseLogMetadata} from './parse-log-metadata';

// Handle messages from the stand alone video server
export function parseVideoMessageV1(message, onResult, onError) {
  if (message instanceof Blob) {
    blobToArrayBuffer(message)
      .then(arrayBuffer => {
        parseVideoMessageV1(arrayBuffer, onResult, onError);
      })
      .catch(onError);
    return;
  }

  try {
    let data = message;
    if (typeof message === 'string') {
      data = JSON.parse(message);
    }
    const result = parseStreamVideoData(data);
    onResult(result);
  } catch (error) {
    onError(error);
  }
}

// Handle messages from the stand alone video server
export function parseStreamVideoData(data) {
  if (data instanceof ArrayBuffer) {
    return parseVideoFrame(data);
  }
  if (data.type === 'metadata') {
    return parseVideoMetadata(data);
  }
  // Unknown message
  return {type: XVIZ_MESSAGE_TYPE.ERROR, message: 'Unknown stream data type', data};
}

// Extract metadata from stream message
function parseVideoMetadata(data) {
  const result = parseLogMetadata(data);
  result.type = XVIZ_MESSAGE_TYPE.VIDEO_METADATA;

  return result;
}

// Parse image data from stream message
// https://code.int.uberatc.com/diffusion/AV/browse/master/source/xviz/services/video/www/index.js
export function parseVideoFrame(arrayBuffer) {
  const view = new DataView(arrayBuffer);

  // Read off version
  const result = {type: XVIZ_MESSAGE_TYPE.VIDEO_FRAME};
  const littleEndian = true;
  const utf8Decoder = new TextDecoder('utf-8');

  // Check version
  let offset = 0;
  result.version = view.getUint32(offset, littleEndian);
  offset += 4;
  result.versionFlags = view.getUint32(offset, littleEndian);
  offset += 4;

  // Read off stream name
  const streamLength = view.getUint32(offset, littleEndian);
  const stringStart = offset + 4;
  offset += 4 + streamLength;

  result.stream = utf8Decoder.decode(arrayBuffer.slice(stringStart, offset));

  // Read off timestamp
  result.timestamp = view.getFloat64(offset, littleEndian);
  offset += 8;

  // Read slice off the image data
  const imageSize = view.getUint32(offset, littleEndian);
  offset += 4;

  result.imageData = arrayBuffer.slice(offset, offset + imageSize);
  result.imageType = 'image/jpeg';

  return result;
}
