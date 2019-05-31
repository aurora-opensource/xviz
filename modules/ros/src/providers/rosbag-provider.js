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

// Generic iterator that stores context for an iterator
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
    this.bagClass = options && options.bagClass || Bag;

    // These likely come from ROSBagProvider arguments passed
    // when added to the XVIZProviderFactory
    this.ros2xvizFactory = options && options.ros2xvizFactory;
    this.topicConfig = options && options.topicConfig;
    this.mapping = options && options.mapping;

    this.options = options || {};
    this.metadata = null;
    this.ros2xviz = null;

    if (!this.ros2xvizFactory) {
      throw new Error('The ROSBAGProvider requires a ROS2XVIZFactory instance');
    }
  }

  log(msg) {
    const logger = this.options;
    if (logger && logger.info) {
      logger.info(msg);
    }
  }

  async init() {
    try {
      // options: {logger}
      this.ros2xviz = this.ros2xvizFactory.create(this.mapping, this.options);

      this.bag = new this.bagClass(this.bagPath, this.topicConfig);

      if (this.bag) {
        // TODO: need to separate out init from metadata gathering
        this.metadata = await this.bag.init(this.ros2xviz);
      }
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

  getMessageIterator(startTime, endTime) {
    // metadata
    let {start_time: start, end_time: end} = this.metadata.data.log_info;

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
        // todo: allow default duration to be an option
        end = start + 30;
      }
    }

    return new MessageIterator(start, end, 0.1);
  }

  async xvizMessage(iterator) {
    const {
      valid,
      data: {start, end}
    } = iterator.next();

    if (!valid) {
      return null;
    }

    // Read Message by keyTopic/stream
    const dataset = await this.bag.readMessageByTime(start, end);
    const msg = await this.ros2xviz.buildMessage(dataset);

    if (msg) {
      return new XVIZData(msg);
    }

    return null;
  }
}
