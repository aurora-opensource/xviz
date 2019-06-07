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
// TODO: move these to @xviz/io
import {isEnvelope, unpackEnvelope} from '@xviz/parser';
import {XVIZ_MESSAGE_TYPE} from './xviz-message-type';
import {XVIZ_MESSAGE_NAMESPACE} from './constants';

// Represents an actual XVIZ Message
//
// Intention is to provide dual data management
// of the XVIZ data.
//
// If data should is passed through untouched, then
// it can be done.
//
// If data needs to be changed, it needs to be
// instantiated by calling `message()`.
//
// Care must be taken when serializing
// to use the `message()` result
export class XVIZMessage {
  constructor(message) {
    this.message = message;
    this._message = null;

    this._setupTypeData();
  }

  get type() {
    return this._message.type;
  }

  get data() {
    return this._message.data;
  }

  _setupTypeData() {
    if (isEnvelope(this.message)) {
      this._message = unpackEnvelope(this.message);
      return;
    }

    // TODO: We should not support data w/o and envelope
    // Raw data, detect by parsing
    if (this.message.version) {
      this._message = {
        namespace: XVIZ_MESSAGE_NAMESPACE,
        type: XVIZ_MESSAGE_TYPE.METADATA,
        data: this.message
      };
    } else if (this.message.update_type && this.message.updates) {
      this._message = {
        namespace: XVIZ_MESSAGE_NAMESPACE,
        type: XVIZ_MESSAGE_TYPE.STATE_UPDATE,
        data: this.message
      };
    } else {
      this._message = {
        namespace: null,
        type: null,
        data: this.message
      };
    }
  }
}
