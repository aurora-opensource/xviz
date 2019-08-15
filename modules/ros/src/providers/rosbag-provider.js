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
import {XVIZData, XVIZEnvelope} from '@xviz/io';
import {XVIZMetadataBuilder} from '@xviz/builder';
import {ROSBag} from '../core/ros-bag';
import {ROSConfig} from '../core/ros-config';

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

export class ROSBagProvider {
  constructor({root, options}) {
    this.bagPath = root.endsWith('.bag') ? root : `${root}.bag`;
    this.BagClass = (options && options.BagClass) || ROSBag;

    // These likely come from ROSBagProvider arguments passed
    // when added to the XVIZProviderFactory
    this.ros2xvizFactory = options && options.ros2xvizFactory;
    this.rosConfig = options && options.rosConfig && new ROSConfig(options.rosConfig);

    this.options = options || {};
    this.metadata = null;
    this.ros2xviz = null;
    this.isValid = false;

    if (!this.ros2xvizFactory) {
      throw new Error('The ROSBagProvider requires a ROS2XVIZFactory instance');
    }
  }

  log(msg) {
    const {logger} = this.options;
    if (logger && logger.info) {
      logger.info(msg);
    }
  }

  async init() {
    try {
      // options: {logger}
      this.ros2xviz = this.ros2xvizFactory.create(this.rosConfig, this.options);
      this.bag = new this.BagClass(this.bagPath, this.rosConfig, this.options);

      if (this.bag) {
        this.isValid = await this.bag.init(this.ros2xviz);
        if (this.isValid) {
          this._getMetadata();
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  valid() {
    return this.isValid;
  }

  _getMetadata() {
    if (this.valid) {
      const xvizMetadataBuilder = new XVIZMetadataBuilder();
      this.bag.getMetadata(xvizMetadataBuilder, this.ros2xviz);

      const rawMetadata = xvizMetadataBuilder.getMetadata();
      this.metadata = XVIZEnvelope.Metadata(rawMetadata);
    }
  }

  xvizMetadata() {
    if (!this.metadata) {
      this._getMetadata();
    }

    if (this.metadata) {
      return new XVIZData(this.metadata);
    }

    return null;
  }

  getMessageIterator({startTime, endTime} = {}) {
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
        // TODO: allow default duration to be an option
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

    const dataset = await this.bag.readMessages(start, end);
    const msg = await this.ros2xviz.buildMessage(dataset);

    if (msg) {
      return new XVIZData(XVIZEnvelope.StateUpdate(msg));
    }

    return null;
  }
}
