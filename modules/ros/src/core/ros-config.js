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

export class ROSConfig {
  // topicConfig should be provided else simply map all topics to a matching converter
  constructor(rosConfig = {}) {
    this.rosConfig = rosConfig;

    this._topics = null;
    this._needsTopicTypes = false;

    this._gatherTopics();
  }

  // Collect a list of all the topics, used by rosbag.js
  _gatherTopics() {
    const {rosConfig} = this;
    if (rosConfig && rosConfig.topicConfig) {
      this._topics = new Set();

      for (const {topic, type, converter} of rosConfig.topicConfig) {
        const typeSet = type !== '' && type !== undefined && type !== null;
        const converterSet = converter !== '' && converter !== undefined && converter !== null;

        // If we do not see a 'type' or 'converter' property, we need to gather the type's manually
        if (!typeSet && !converterSet) {
          this._needsTopicTypes = true;
        }

        // Used for the rosbag.js
        this._topics.add(topic);
      }
    } else {
      // Without a config we need types
      this._needsTopicTypes = true;
    }
  }

  get topics() {
    if (this._topics) {
      return Array.from(this._topics.values());
    }

    return null;
  }

  get topicConfig() {
    return this.rosConfig.topicConfig;
  }

  get entryCount() {
    if (this.rosConfig.topicConfig) {
      return this.rosConfig.topicConfig.length;
    }

    return 0;
  }

  needsTopicTypes() {
    return this._needsTopicTypes;
  }
}
