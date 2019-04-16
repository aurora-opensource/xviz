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
import {parseBinaryXVIZ, isBinaryXVIZ} from '@xviz/parser';
import {XVIZMessage} from './xviz-message';
import {TextDecoder} from './text-encoding';
import {XVIZFormat} from './constants';

/* global Buffer */

// expected return value of null | binary | string | object
function getDataContainer(data) {
  if (data === null || data === undefined) {
    return null;
  }

  if (data instanceof Buffer || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return 'binary';
  }

  // Cover string || object
  return typeof data;
}

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

// Represents raw xviz data and
// can create an XVIZMessage
//
// Assume isXVIZMessage has been called
//
// Raw data formats supported:
// - JSON string
// - arraybuffer which is a JSON string
// - JSON object
// - arraybuffer which is a GLB

export class XVIZData {
  constructor(data) {
    this._data = data;
    this._message = undefined;
    this._dataFormat = undefined;

    this._determineFormat();

    if (!this._dataFormat) {
      throw new Error('Unknown XVIZ data type', JSON.stringify(data));
    }
  }

  get buffer() {
    return this._data;
  }

  dataFormat() {
    return this._dataFormat;
  }

  hasMessage() {
    return this._message !== undefined;
  }

  // converts data to JS object
  message() {
    let msg = null;
    if (this._message) {
      return this._message;
    }

    let data = this._data;
    switch (this._dataFormat) {
      case XVIZFormat.binary:
        if (data instanceof Buffer) {
          data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); // eslint-disable-line no-fallthrough
        }
        msg = parseBinaryXVIZ(data);
        break;
      case XVIZFormat.jsonBuffer:
        let jsonString = null;
        if (data instanceof Buffer) {
          // Default to utf8 encoding
          jsonString = data.toString();
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          data = new Uint8Array(data);

          // This is slow
          jsonString = new TextDecoder('utf8').decode(data);
        }

        msg = JSON.parse(jsonString);
        break;
      case XVIZFormat.jsonString:
        msg = JSON.parse(data);
        break;
      case XVIZFormat.object:
        // TODO: what is the recursive case?
        // see parse-stream-data-message.js
        msg = data;
        break;
      default:
        throw new Error(`Unsupported format ${this._dataFormat}`);
    }

    this._message = new XVIZMessage(msg);
    return this._message;
  }

  _determineFormat() {
    let data = this._data;
    switch (getDataContainer(data)) {
      case 'binary':
        if (data instanceof Buffer) {
          data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); // eslint-disable-line no-fallthrough
        }

        if (isBinaryXVIZ(data)) {
          this._dataFormat = XVIZFormat.binary;
        }

        if (data instanceof ArrayBuffer) {
          data = new Uint8Array(data);
        }

        if (isJSONString(data)) {
          this._dataFormat = XVIZFormat.jsonBuffer;
        }
        break;
      case 'string':
        if (isJSONString(data)) {
          this._dataFormat = XVIZFormat.jsonString;
        }
        break;
      case 'object':
        this._dataFormat = XVIZFormat.object;
        break;

      default:
    }
  }
}
