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

/* global Buffer */

// expected return of null | binary | string | object
function getDataFormat(data) {
  if (data === null || data === undefined) {
    return null;
  }

  // Node
  if (data instanceof Buffer) {
    return 'buffer';
  }

  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return 'binary';
  }
  return typeof data;
}

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

  // TODO: need a function to return the _data or if there is a message
  // return that formatted the same as the original

  // converts data to JS object
  message() {
    let msg = null;
    if (!this._message) {
      switch (this._dataFormat) {
        case 'binary':
          // TODO: handle buffer and arrayBuffer
          msg = parseBinaryXVIZ(this._data.buffer);
          break;
        case 'json_buffer':
          const data = new Uint8Array(this._data);
          const jsonString = new TextDecoder('utf8').decode(data);
          msg = JSON.parse(jsonString);
          break;
        case 'json_string':
          msg = JSON.parse(this._data);
          break;
        case 'object':
          // TODO: what is the recursive case?
          // see parse-stream-data-message.js
          msg = this._data;
          break;
        default:
      }

      this._message = new XVIZMessage(msg);
    }

    return this._message;
  }

  _determineFormat() {
    let data = this._data;
    switch (getDataFormat(data)) {
      case 'buffer':
        // TODO: Cheap node buffer -> arraybuffer, but not valid if buffer is a bufferview
        data = data.buffer; // eslint-disable-line no-fallthrough
      case 'binary':
        if (isBinaryXVIZ(data)) {
          this._dataFormat = 'binary';
        }
        if (data instanceof ArrayBuffer) {
          data = new Uint8Array(data);
        }
        if (isJSONString(data)) {
          this._dataFormat = 'json_buffer';
        }
        break;
      case 'string':
        if (isJSONString(data)) {
          this._dataFormat = 'json_string';
        }
        break;
      case 'object':
        this._dataFormat = 'object';
        break;

      default:
    }
  }
}
