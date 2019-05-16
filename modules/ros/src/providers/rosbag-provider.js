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
import {XVIZData} from '@xviz/io';
import {Bag} from '@xviz/ros';

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

    const val = this.current;
    this.current += this.increment;

    return {
      valid,
      data: {
        start: val,
        end: this.current
      }
    };
  }

  // [Symbol.iterator] = () => this;
}

// People will need to create their own ROSBAGDataProvider
// and use their subclassed 'Bag' instance
// ... could take the type as a parameter
//
// keyTopic is required
// stream metadtata and vehicle relative
//
export class ROSBAGProvider {
  constructor({root, options}) {
    this.bagPath = root.endsWith('.bag') ? root : `${root}.bag`;
    this.options = options;
    this.metadata = null;

    this.bag = null;
  }

  async init() {
    try {
      // TODO test what happens when bagPath is not a bag
      this.bag = new Bag(this.bagPath, '/current_pose');
      this.metadata = await this.bag.init();
    } catch (err) {
      console.log(err);
    }
  }

  valid() {
    return Boolean(this.bag) && this.metadata;
  }

  xvizMetadata() {
    return new XVIZData(this.metadata);
  }

  getFrameIterator(startTime, endTime) {
    // metadata
    let {start_time: start, end_time: end} = this.metadata.data;

    // bounds check params
    if (startTime) {
      if (startTime >= start && startTime <= end) {
        start = startTime;
      }
    }

    if (endTime) {
      if (endTime >= start && endTime <= end) {
        end = endTime;
      } else {
        // todo: allow server duration limit
        end = start + 30;
      }
    }
    // todo: server limit on duration
    return new FrameIterator(start, end, 0.1);
  }

  async xvizFrame(iterator) {
    const {
      valid,
      data: {start, end}
    } = iterator.next();
    if (!valid) {
      return null;
    }

    // Read Frame by keyTopic/stream
    const frame = await this.bag.readFrameByTime(start, end);
    return new XVIZData(frame);
  }
}
