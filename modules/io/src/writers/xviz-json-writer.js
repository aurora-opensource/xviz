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

import {XVIZBaseWriter} from './xviz-base-writer';
import {xvizConvertJson} from './xviz-json-encoder';
import {TextEncoder} from '../common/text-encoding';
import {XVIZEnvelope} from '@xviz/io';

// 0-frame is an index file for timestamp metadata
// 1-frame is the metadata file for the log
// 2-frame is where the actual XVIZ updates begin
const messageName = index => `${index + 2}-frame`;

export class XVIZJSONWriter extends XVIZBaseWriter {
  constructor(sink, options = {}) {
    super(sink);

    const {envelope = true, precision = 10, asArrayBuffer = false} = options;
    this.messageTimings = {
      messages: new Map()
    };
    this.wroteMessageIndex = null;
    this.options = {envelope, precision, asArrayBuffer};
  }

  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizMetadata) {
    this._checkValid();
    this._saveTimestamp(xvizMetadata);

    if (this.options.envelope) {
      xvizMetadata = XVIZEnvelope.Metadata(xvizMetadata);
    }

    const msg = JSON.stringify(xvizMetadata);
    this.writeToSink('1-frame.json', msg);
  }

  writeMessage(messageIndex, xvizMessage) {
    this._checkValid();
    this._saveTimestamp(xvizMessage, messageIndex);

    if (this.options.envelope) {
      xvizMessage = XVIZEnvelope.StateUpdate(xvizMessage);
    }

    // Limit precision to save space
    const numberRounder = (k, value) => {
      if (typeof value === 'number') {
        return Number(value.toFixed(this.options.precision));
      }

      return value;
    };

    const jsonXVIZMessage = xvizConvertJson(xvizMessage);
    const msg = JSON.stringify(jsonXVIZMessage, numberRounder);
    this.writeToSink(`${messageName(messageIndex)}.json`, msg);
  }

  _writeMessageIndex() {
    this._checkValid();
    const {startTime, endTime, messages} = this.messageTimings;
    const messageTimings = {};

    if (startTime) {
      messageTimings.startTime = startTime;
    }

    if (endTime) {
      messageTimings.endTime = endTime;
    }

    // Sort messages by index before writing out as an array
    const messageTimes = Array.from(messages.keys()).sort((a, b) => a - b);

    const timing = [];
    messageTimes.forEach((value, index) => {
      // Value is two greater than message index
      const limit = timing.length;
      if (value > limit) {
        // Adding 2 because 1-frame is metadata file, so message data starts at 2
        throw new Error(
          `Error writing time index file. Messages are missing between ${limit + 2} and ${value +
            2}`
        );
      }

      timing.push(messages.get(value));
    });
    messageTimings.timing = timing;

    const msg = JSON.stringify(messageTimings);
    this.writeToSink('0-frame.json', msg);
    this.wroteMessageIndex = timing.length;
  }

  close() {
    if (this.sink) {
      if (!this.wroteMessageIndex) {
        this._writeMessageIndex();
      }

      super.close();
    }
  }

  /* eslint-disable camelcase */
  _saveTimestamp(xviz_data, index) {
    const {log_info, updates} = xviz_data;

    if (index === undefined) {
      // Metadata case
      if (log_info) {
        const {start_time, end_time} = log_info || {};
        if (start_time) {
          this.messageTimings.startTime = start_time;
        }

        if (end_time) {
          this.messageTimings.endTime = end_time;
        }
      }
    } else if (updates) {
      if (updates.length === 0 || !updates.every(update => typeof update.timestamp === 'number')) {
        throw new Error('XVIZ updates did not contain a valid timestamp');
      }

      const min = Math.min(updates.map(update => update.timestamp));
      const max = Math.max(updates.map(update => update.timestamp));

      this.messageTimings.messages.set(index, [min, max, index, messageName(index)]);
    } else {
      // Missing updates & index is invalid call
      throw new Error('Cannot find timestamp');
    }
  }
  /* eslint-enable camelcase */

  writeToSink(name, msg) {
    if (this.options.asArrayBuffer) {
      const encoder = new TextEncoder();
      // TODO: measure this as it is likely expensive
      msg = encoder.encode(msg);
    }

    this.sink.writeSync(name, msg);
  }
}
