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
export class PreloadDataSource {
  constructor(args) {
    this.dataSource = args.dataSource;
    this.frames = [0, 1];

    console.log('~~ Preloading Frames');
    this._preloadFrames();
    console.log(`~~ Loaded ${this.frames.length} Frames`);
  }

  _preloadFrames() {
    // TODO: get metadata for start/end time
    //       then use that to get all the data
    // for (let i = 2; i < Number.MAX_SAFE_INTEGER;  i++) {
    for (let i = 2; i < 10; i++) {
      const data = this.dataSource.xvizFrameByIndex(i);
      if (data) {
        // TODO: this is a hack and should not be required
        // pre-convert
        // console.log('preload', i);
        // data.object();
        this.frames.push(data);
        // console.log('preload done', i);
      } else {
        break;
      }
    }
  }

  async xvizIndex() {
    return this.dataSource.xvizIndex();
  }

  xvizMetadata() {
    return this.dataSource.xvizMetadata();
  }

  xvizFrameByIndex(index) {
    return this.frames[index];
  }
}
