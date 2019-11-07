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
import {XVIZData} from '../common/xviz-data';

// Generic iterator that stores context for context for an iterator
class MessageIterator {
  constructor(start, end, increment = 1) {
    this.start = start;
    this.end = end;
    this.increment = increment;
    this.current = start;
  }

  valid() {
    return this.current <= this.end;
  }

  value() {
    return this.current;
  }

  next() {
    const valid = this.valid();
    if (!valid) {
      return {valid};
    }

    const data = this.current;
    this.current += this.increment;

    return {
      valid,
      data
    };
  }
}

export class XVIZBaseProvider {
  constructor({reader, options}) {
    this.reader = reader;
    this.options = options;

    this.metadata = null;
    this._valid = false;
  }

  // Read index & metadata
  async init() {
    if (!this.reader) {
      return;
    }

    const {startTime, endTime} = this.reader.timeRange();
    this.metadata = this._readMetadata();

    if (
      this.metadata &&
      Number.isFinite(startTime) &&
      Number.isFinite(endTime) &&
      this.reader.checkMessage(0) // verify the first message exists
    ) {
      this._valid = true;
    }

    if (this.metadata && (!Number.isFinite(startTime) || !Number.isFinite(endTime))) {
      // TODO: should provide a command for the cli to regenerate the index files
      throw new Error('The data source is missing the data index');
    }
  }

  valid() {
    return this._valid;
  }

  xvizMetadata() {
    return this.metadata;
  }

  async xvizMessage(iterator) {
    const {valid, data} = iterator.next();
    if (!valid) {
      return null;
    }

    const message = this._readMessage(data);
    return message;
  }

  // The Provider provides an iterator since
  // different sources may "index" their data independently
  // however all iterators are based on a startTime/endTime
  //
  // If startTime and endTime cover the actual range, then
  // they will be clamped to the actual range.
  // Otherwise return undefined.
  getMessageIterator({startTime, endTime} = {}, options = {}) {
    const {startTime: start, endTime: end} = this.reader.timeRange();

    if (!Number.isFinite(startTime)) {
      startTime = start;
    }

    if (!Number.isFinite(endTime)) {
      endTime = end;
    }

    if (startTime > endTime) {
      return null;
    }

    const startMessages = this.reader.findMessage(startTime);
    const endMessages = this.reader.findMessage(endTime);

    if (startMessages !== undefined && endMessages !== undefined) {
      return new MessageIterator(startMessages.first, endMessages.last);
    }

    return null;
  }

  // return XVIZData for message or undefined
  _readMessage(message) {
    const data = this.reader.readMessage(message);
    if (data) {
      return new XVIZData(data);
    }

    return undefined;
  }

  // return Metadata or undefined
  _readMetadata() {
    const data = this.reader.readMetadata();
    if (data) {
      return new XVIZData(data);
    }

    return undefined;
  }
}
