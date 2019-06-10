import fs from 'fs';

import {
  ROSBAGProvider,
  ROS2XVIZFactory
} from '@xviz/ros';

import {XVIZProviderFactory} from '@xviz/io';
import {PaccarBag} from './paccar-bag';

import {
  GeometryPoseStamped,
  NavPath,
  LidarConverter,
  SensorCompressedImage,
  VisualizationMarkerArray
} from '@xviz/ros';
import {SensorNavSatFix} from '../messages/sensor-navsatfix-converter'; 
import {SensorImage} from '../messages/sensor-image-converter'; 

export function setupCustomProvider(options) {
  // Setup ROS support based on arguments
  //
  // Custom Converters should be added here
  const ros2xvizFactory = new ROS2XVIZFactory([
    SensorImage,
    SensorNavSatFix
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

    BagClass: PaccarBag,
    ros2xvizFactory,
  };
  XVIZProviderFactory.addProviderClass(ROSBAGProvider, rosbagProviderConfig);
}
