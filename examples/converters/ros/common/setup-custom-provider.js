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
import fs from 'fs';

import {ROSBAGProvider, ROS2XVIZFactory} from '@xviz/ros';

import {XVIZProviderFactory} from '@xviz/io';
import {VoyagerBag} from './voyager-bag';

import {
  GeometryPoseStamped,
  NavPath,
  LidarConverter,
  SensorCompressedImage,
  SensorImage,
  VisualizationMarkerArray
} from '@xviz/ros';

export function setupCustomProvider(options) {
  // Setup ROS support based on arguments
  //
  // Custom Converters should be added here
  const ros2xvizFactory = new ROS2XVIZFactory([
    GeometryPoseStamped,
    NavPath,
    LidarConverter,
    SensorCompressedImage,
    SensorImage,
    VisualizationMarkerArray
  ]);

  const {rosConfig} = options;
  let config = null;
  if (rosConfig) {
    // topicConfig: { keyTopic, topics }
    // mapping: [ { topic, name, config: {xvizStream, field} }, ... ]
    const data = fs.readFileSync(rosConfig);
    if (data) {
      config = JSON.parse(data);
    }
  }

  const rosbagProviderConfig = {
    ...config,
    // topicConfig
    // mapping

    // logger

    BagClass: VoyagerBag,
    ros2xvizFactory
  };
  XVIZProviderFactory.addProviderClass(ROSBAGProvider, rosbagProviderConfig);
}
