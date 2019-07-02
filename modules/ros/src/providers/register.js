/* global console */
/* eslint-disable no-console */
import {XVIZProviderFactory} from '@xviz/io';

import {ROSBag} from '../core/ros-bag';
import {ROS2XVIZFactory} from '../core/ros-2-xviz-factory';
import {ROSBagProvider} from '../providers/rosbag-provider';
import {DEFAULT_CONVERTERS} from '../messages';

import fs from 'fs';

export function registerROSBagProvider(
  rosConfig,
  {converters = DEFAULT_CONVERTERS, BagClass = ROSBag} = {}
) {
  if (rosConfig) {
    console.log(`Setting up ROSProvider with ${rosConfig}`);
  }

  let config = null;
  if (rosConfig) {
    const data = fs.readFileSync(rosConfig);
    if (data) {
      config = JSON.parse(data);
    }
  }

  const ros2xvizFactory = new ROS2XVIZFactory(converters);
  const rosbagProviderConfig = {
    rosConfig: config,
    ros2xvizFactory,
    BagClass
  };

  XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);
}
