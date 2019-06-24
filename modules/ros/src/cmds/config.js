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
/* eslint-disable no-console, max-depth */
import {open} from 'rosbag';

export async function Config(args) {
  const {bag: bagPath} = args;
  /*
   * topicsConfig[]
   *
   * {topic, type, converter, config: {xvizStream}}
   */
  const bag = await open(bagPath);

  const seen = [];
  const topics = [];
  for (const conn in bag.connections) {
    const {topic, type} = bag.connections[conn];

    if (!seen[topic]) {
      seen[topic] = true;
      topics.push({topic, type});
    }
  }

  const config = {
    topicConfig: topics
  };

  console.log(JSON.stringify(config, null, 2));
}
