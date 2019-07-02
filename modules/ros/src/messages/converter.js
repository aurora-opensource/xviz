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
/**
 * Abstract Converter class that all converters must implement
 */
export default class Converter {
  constructor(config) {
    this.config = config;

    this._setup();
  }

  _setup() {
    if (!this.config.topic) {
      throw new Error('ROS Message converter must have a topic to convert');
    }

    if (!this.config.xvizStream) {
      this.config.xvizStream = this.config.topic;
    }
  }

  get topic() {
    return this.config.topic;
  }

  get xvizStream() {
    return this.config.xvizStream;
  }

  async convertMessage(frame, xvizBuilder) {
    throw new Error('Implement me');
  }

  getMetadata(xvizMetaBuilder, aux) {
    throw new Error('Implement me');
  }
}
