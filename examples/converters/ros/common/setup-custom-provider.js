import fs from 'fs';

import {
  ROSBAGProvider,
  ROS2XVIZFactory
} from '@xviz/ros';

import {XVIZProviderFactory} from '@xviz/io';
import {CustomBag} from './custom-bag';

import {
  GeometryPoseStamped,
  NavPath,
  LidarConverter,
  SensorImage,
  SensorCompressedImage,
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

    BagClass: CustomBag,
    ros2xvizFactory,
  };
  XVIZProviderFactory.addProviderClass(ROSBAGProvider, rosbagProviderConfig);
}
