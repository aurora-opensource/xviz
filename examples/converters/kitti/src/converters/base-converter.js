import fs from 'fs';
import path from 'path';

import {getTimestamps} from '../parsers/common';

export default class BaseConverter {
  constructor(rootDir, streamDir) {
    // KITTY data streams follow a consistent directory structure
    // root/image_00/data, root/velodyne_points/data
    this.rootDir = rootDir;
    this.streamDir = path.join(this.rootDir, streamDir);
    this.dataDir = path.join(this.streamDir, 'data');
  }

  load() {
    // Load data file names and sort them
    this.fileNames = fs.readdirSync(this.dataDir).sort();

    // Load time stamp table
    const timeFilePath = path.join(this.streamDir, 'timestamps.txt');
    this.timestamps = getTimestamps(timeFilePath);
  }

  async loadFrame(frameNumber) {
    // Load the data for this frame
    const fileName = this.fileNames[frameNumber];
    const srcFilePath = path.join(this.dataDir, fileName);
    const data = fs.readFileSync(srcFilePath);

    // Get the time stamp
    const timestamp = this.timestamps[frameNumber];

    return {data, timestamp};
  }
}
