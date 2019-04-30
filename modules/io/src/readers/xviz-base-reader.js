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
import {isJSONString} from '../common/xviz-data';

// Base class that uses a Source to read file XVIZ file data
export class XVIZBaseReader {
  constructor(source, options = {}) {
    this.source = source;
    this.options = options;
    this.suffix = options.suffix || '-frame.json';

    // Read the frame index
    this.index = this._readIndex();
    /* Index schema
     * startTime,
     * endTime,
     * timing: [ [minFrameTime, maxFrameTime, index, name], ...]
     */
  }

  readMetadata() {
    return this.source.readSync(this._xvizFrame(1));
  }

  readFrame(frameIndex) {
    // Data frames begin at the filename 2-frame.*
    return this.source.readSync(this._xvizFrame(2 + frameIndex));
  }

  timeRange() {
    if (this.index) {
      const {startTime, endTime} = this.index;
      return {startTime, endTime};
    }

    return {startTime: null, endTime: null};
  }

  frameCount() {
    if (this.index) {
      return this.index.timing.length;
    }

    return undefined;
  }

  // Returns 2 indices covering the frames that bound the requested timestamp
  findFrame(timestamp) {
    if (!this.index) {
      return undefined;
    }

    const {startTime, endTime, timing} = this.index;
    const frameCount = this.frameCount();
    const lastFrame = frameCount > 0 ? frameCount - 1 : 0;

    if (timestamp < startTime) {
      return [0, 0];
    }

    if (timestamp > endTime) {
      return [lastFrame, lastFrame];
    }

    let startIndex = timing.findIndex(timeEntry => timeEntry[0] >= timestamp);
    let endIndex = timing
      .slice()
      .reverse()
      .findIndex(timeEntry => timeEntry[1] <= timestamp);

    if (startIndex === -1) {
      startIndex = 0;
    }

    if (endIndex === -1) {
      endIndex = lastFrame;
    }

    // TODO: this smells like an error in the logic
    if (endIndex < startIndex) {
      endIndex = startIndex;
    }

    return [startIndex, endIndex];
  }

  close() {
    this.source.close();
  }

  // Support various formatted frame names
  _xvizFrame(index) {
    if (index === 0) {
      // index file is always json
      return `0-frame.json`;
    }

    return `${index}${this.suffix}`;
  }

  _readIndex() {
    const indexData = this.source.readSync(this._xvizFrame(0));
    if (indexData) {
      if (isJSONString(indexData)) {
        return JSON.parse(indexData);
      } else if (typeof indexData === 'object') {
        return indexData;
      }
    }

    return undefined;
  }
}
