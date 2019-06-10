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
  SensorPointCloud2,
  SensorCompressedImage,
  SensorImage,
  VisualizationMarker,
  VisualizationMarkerArray
} from '@xviz/ros';
import {MotionPlanOutput} from '../messages/motion-plan-output-converter';
import {Route} from '../messages/route-converter';
import {TrackList} from '../messages/tracklist-converter';

export function setupCustomProvider(options) {
  // Setup ROS support based on arguments
  //
  // Custom Converters should be added here
  const converters = [
    GeometryPoseStamped,
    NavPath,
    SensorPointCloud2,
    SensorCompressedImage,
    SensorImage,
    VisualizationMarker,
    VisualizationMarkerArray,
    MotionPlanOutput,
    Route,
    TrackList
  ];
  console.log(converters);
  const ros2xvizFactory = new ROS2XVIZFactory(converters);

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
