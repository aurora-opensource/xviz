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
/* global console */
/* eslint-disable no-console */
import {isJSONString, XVIZData} from '../common/xviz-data';

// Generic iterator that stores context for context for an iterator
class FrameIterator {
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

// TODO
// - limits() for min/max time/frame
// - configuration(config) {}
// - reconfigure(config) {}

export class XVIZBaseDataProvider {
  constructor({reader, options}) {
    this.reader = reader;
    this.options = options;

    this.metadata = null;
    this.indexFile = null;
    // {
    //  startTime
    //  endTime
    //  timing [
    //    [first, end, index, "2-frame'],
    //  ]
    // }

    this._valid = false;
  }

  // Read index & metadata
  async init() {
    if (!this.reader) {
      return;
    }

    this.indexFile = this._readIndex();
    this.metadata = this._readMetadata();

    if (
      this.metadata &&
      this.indexFile &&
      Number.isFinite(this.indexFile.startTime) &&
      Number.isFinite(this.indexFile.endTime)
    ) {
      this._valid = true;
    }

    if (
      this.metadata &&
      (!this.indexFile ||
        !Number.isFinite(this.indexFile.startTime) ||
        !Number.isFinite(this.indexFile.endTime))
    ) {
      // TODO: should provide a command for hte cli to regenerate the index files
      console.log('index file needs recreated');
    }
  }

  valid() {
    return this._valid;
  }

  xvizMetadata() {
    return this.metadata;
  }

  async xvizFrame(iterator) {
    const {valid, data} = iterator.next();
    if (!valid) {
      return null;
    }

    const frame = this._readFrame(data);
    return frame;
  }

  // The DataProvider provides an iterator since
  // different sources may "index" their data independently
  // however all iterators are based on a startTime/endTime
  //
  // TODO: live mode?
  //
  // If startTime and endTime cover the actual range, then
  // they will be clamped to the actual range.
  // Otherwise return undefined.
  getFrameIterator(startTime, endTime) {
    let start = this.indexFile.startTime;
    let end = this.indexFile.endTime;

    // Completely invalid
    if (endTime < startTime) {
      return undefined;
    }

    // Validate desired range is in bounds
    if (startTime > end) {
      return undefined;
    }

    if (endTime < start) {
      return undefined;
    }

    // bounds check params
    if (startTime) {
      if (startTime >= start) {
        start = startTime;
      }
    }

    if (endTime) {
      if (endTime <= end) {
        end = endTime;
      }
    }
    // todo: server limit on duration

    // Find indices based on time
    const startIndex = this.indexFile.timing.findIndex(timeEntry => timeEntry[0] >= start);
    const endReverseIndex = this.indexFile.timing
      .slice()
      .reverse()
      .findIndex(timeEntry => timeEntry[1] <= end);
    const endIndex = this.indexFile.timing.length - endReverseIndex - 1;
    return new FrameIterator(startIndex, endIndex);
  }

  // return XVIZData for frame or undefined
  _readFrame(frame) {
    const data = this.reader.readFrame(frame);
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

  // Return XVIZ Index object read from the reader
  // TODO(twojtasz): Odd that this is not and XVIZData
  _readIndex() {
    const data = this.reader.readFrameIndex();

    if (isJSONString(data)) {
      return JSON.parse(data);
    } else if (typeof data === 'object') {
      return data;
    }

    return undefined;
  }
}
