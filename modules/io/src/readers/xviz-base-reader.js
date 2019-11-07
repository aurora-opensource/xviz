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
import {isJSONString} from '../common/loaders';

// Base class that uses a Source to read file XVIZ file data
export class XVIZBaseReader {
  constructor(source, options = {}) {
    this.source = source;
    this.options = options;
    this.suffix = options.suffix || '-frame.json';

    // Read the message index
    this.index = this._readIndex();
    /* Index schema
     * startTime,
     * endTime,
     * timing: [ [minMessageTime, maxMessageTime, index, name], ...]
     */
  }

  readMetadata() {
    if (this.source) {
      let data = this.source.readSync(this._xvizMessage(1));
      if (!data) {
        data = this.source.readSync(this._xvizMessage(1, {forceJson: true}));
      }
      return data;
    }

    return undefined;
  }

  readMessage(messageIndex) {
    if (this.source) {
      // Data messages begin at the filename 2-frame.*
      return this.source.readSync(this._xvizMessage(2 + messageIndex));
    }

    return undefined;
  }

  checkMessage(messageIndex) {
    if (this.source) {
      return this.source.existsSync(this._xvizMessage(2 + messageIndex));
    }

    return false;
  }

  timeRange() {
    if (this.index) {
      const {startTime, endTime} = this.index;
      return {startTime, endTime};
    }

    return {startTime: null, endTime: null};
  }

  messageCount() {
    if (this.index) {
      return this.index.timing.length;
    }

    return undefined;
  }

  // Returns 2 indices covering the messages that bound the requested timestamp
  findMessage(timestamp) {
    if (!this.index) {
      return undefined;
    }

    const {startTime, endTime, timing} = this.index;
    const messageCount = this.messageCount();
    const lastMessage = messageCount > 0 ? messageCount - 1 : 0;

    if (timestamp < startTime) {
      return {first: 0, last: 0};
    }

    if (timestamp > endTime) {
      return {first: lastMessage, last: lastMessage};
    }

    let first = timing.findIndex(timeEntry => timeEntry[0] >= timestamp);

    // Reverse search for end index
    let last = -1;
    let i = lastMessage;
    while (i >= 0) {
      const timeEntry = timing[i];
      if (timeEntry[1] <= timestamp) {
        last = i;
        break;
      }

      i--;
    }

    if (first === -1) {
      first = 0;
    }

    if (last === -1) {
      last = lastMessage;
    }

    return {first, last};
  }

  close() {
    this.source.close();
  }

  // Support various formatted message names
  _xvizMessage(index, {forceJson = false} = {}) {
    if (index === 0 || forceJson) {
      return `${index}-frame.json`;
    }

    return `${index}${this.suffix}`;
  }

  _readIndex() {
    if (this.source) {
      const indexData = this.source.readSync(this._xvizMessage(0));
      if (indexData) {
        if (isJSONString(indexData)) {
          return JSON.parse(indexData);
        } else if (typeof indexData === 'object') {
          return indexData;
        }
      }
    }

    return undefined;
  }
}
