/* eslint-disable camelcase */
import uuid from 'uuid/v4';

import BaseConverter from './base-converter';
import {loadLidarData} from '../parsers/parse-lidar-points';

// load file
export default class LidarConverter extends BaseConverter {
  constructor(rootDir, streamDir, {disabledStreams = []} = {}) {
    super(rootDir, streamDir);

    this.LIDAR_POINTS = '/lidar/points';

    this.disabled = disabledStreams
      .map(pattern => RegExp(pattern).test(this.LIDAR_POINTS))
      .some(x => x === true);
  }

  async convertFrame(frameNumber, xvizBuilder) {
    if (this.disabled) {
      return;
    }

    const {data} = await this.loadFrame(frameNumber);
    const lidarData = loadLidarData(data);

    xvizBuilder
      .primitive(this.LIDAR_POINTS)
      .points(lidarData.positions)
      .colors(lidarData.colors)
      .id(uuid());
  }

  getMetadata(xvizMetaBuilder) {
    const xb = xvizMetaBuilder;
    xb.stream(this.LIDAR_POINTS)
      .category('primitive')
      .type('point')
      .streamStyle({
        fill_color: '#00a',
        radius_pixels: 2
      })
      // laser scanner relative to GPS position
      // http://www.cvlibs.net/datasets/kitti/setup.php
      .coordinate('VEHICLE_RELATIVE')
      .pose({
        x: 0.81,
        y: -0.32,
        z: 1.73
      });
  }
}
