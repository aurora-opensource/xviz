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
/* eslint-disable complexity */
import {
  getDataContainer,
  parseBinaryXVIZ,
  isGLBXVIZ,
  isJSONString,
  isPBEXVIZ,
  getXVIZMessageType
} from './loaders';
import {XVIZMessage} from './xviz-message';
import {TextDecoder} from './text-encoding';
import {XVIZ_FORMAT} from './constants';

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

    // _dataFormat is an XVIZ_FORMAT for 'data'
    this._dataFormat = undefined;

    // _xvizType is the XVIZ Envelope 'type'
    this._xvizType = undefined;

    // _message is an XVIZMessage and has been fully parsed
    this._message = undefined;

    this._determineFormat();

    if (!this._dataFormat) {
      throw new Error('Unknown XVIZ data format');
    }
  }

  get buffer() {
    return this._data;
  }

  get format() {
    return this._dataFormat;
  }

  // In some cases this can be as expensive as a parse, so we do not
  // load this unless asked for explicitly.
  get type() {
    if (this._message) {
      return this._message.type;
    } else if (!this._xvizType) {
      const rawType = getXVIZMessageType(this._data);
      if (rawType) {
        const parts = rawType.split('/');
        this._xvizType = {
          namespace: parts[0],
          type: parts[1]
        };
      }
    }

    return this._xvizType.type;
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
      case XVIZ_FORMAT.BINARY_GLB:
        if (data instanceof Buffer) {
          data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
        msg = parseBinaryXVIZ(data);
        break;
      case XVIZ_FORMAT.BINARY_PBE:
        if (data instanceof Buffer) {
          data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
        msg = parseBinaryXVIZ(data);
        break;
      case XVIZ_FORMAT.JSON_BUFFER:
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
      case XVIZ_FORMAT.JSON_STRING:
        msg = JSON.parse(data);
        break;
      case XVIZ_FORMAT.OBJECT:
        msg = data;
        break;
      default:
        throw new Error(`Unsupported format ${this._dataFormat}`);
    }

    const xvizMsg = new XVIZMessage(msg);
    if (xvizMsg.data) {
      this._message = xvizMsg;
      return this._message;
    }

    return null;
  }

  _determineFormat() {
    let data = this._data;
    switch (getDataContainer(data)) {
      case 'binary':
        if (data instanceof Buffer) {
          data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        if (isPBEXVIZ(data)) {
          this._dataFormat = XVIZ_FORMAT.BINARY_PBE;
        } else if (isGLBXVIZ(data)) {
          this._dataFormat = XVIZ_FORMAT.BINARY_GLB;
        } else {
          if (data instanceof ArrayBuffer) {
            data = new Uint8Array(data);
          }

          if (isJSONString(data)) {
            this._dataFormat = XVIZ_FORMAT.JSON_BUFFER;
          }
        }
        break;
      case 'string':
        if (isJSONString(data)) {
          this._dataFormat = XVIZ_FORMAT.JSON_STRING;
        }
        break;
      case 'object':
        this._dataFormat = XVIZ_FORMAT.OBJECT;
        break;

      default:
    }
  }
}
