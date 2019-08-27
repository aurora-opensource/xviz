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
/* eslint-disable camelcase */

// v1.0 Backwards compatiblity support to
// accesing topics as a property
export const ROSMessageHandler = {
  get: (target, prop, receiver) => {
    let field;
    if (prop in target.topics) {
      field = target.topics[prop];
    } else {
      field = Reflect.get(target, prop, receiver);
    }

    return field;
  },
  // Below supports Object.keys() on the proxy
  ownKeys: target => {
    return Reflect.ownKeys(target.topics);
  },
  getOwnPropertyDescriptor: target => {
    return {
      enumerable: true,
      configurable: true
    };
  }
};

/* A collection of messages along with auxillary data
 * to aid in converting ROS messages into XVIZ
 */
export class ROSMessages {
  constructor({transforms} = {}) {
    this.topics = {};
    this.tforms = transforms;
  }

  add(topic, message) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }

    this.topics[topic].push(message);
  }

  topic(topic) {
    return this.topics[topic];
  }

  transforms() {
    return this.tforms;
  }
}
