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

  async loadMessage(messageNumber) {
    // Load the data for this message
    const fileName = this.fileNames[messageNumber];
    const srcFilePath = path.join(this.dataDir, fileName);
    const data = fs.readFileSync(srcFilePath);

    // Get the time stamp
    const timestamp = this.timestamps[messageNumber];

    return {data, timestamp};
  }
}
