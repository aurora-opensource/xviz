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
import {
  GeometryPoseStamped,
  NavPath,
  LidarConverter,
  SensorImage,
  SensorCompressedImage,
  VisualizationMarkerArray
} from '../messages';

const converters = [
  GeometryPoseStamped,
  NavPath,
  LidarConverter,
  SensorImage,
  SensorCompressedImage,
  VisualizationMarkerArray
];

function getConverter(topicType) {
  return converters.find(converter => converter.topicType === topicType);
}

export function topicMapper(topics, topicConfig, origin) {
  for (const topicName in topics) {
    const topic = topics[topicName];
    console.log(topicName, topic.type);
    const Converter = getConverter(topic.type);
    if (Converter) {
      if (topicConfig.keyTopic === topicName) {
        topic.converter = new Converter(topicName, origin);
      } else {
        topic.converter = new Converter(topicName);
      }
    } else {
      console.log(`No converter for topic ${topicName} with type ${topic.type}`);
    }
  }
}
