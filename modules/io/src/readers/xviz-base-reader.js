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
// Base class that uses a Source to read file XVIZ file data
export class XVIZBaseReader {
  constructor(source, options = {}) {
    this.source = source;
    this.options = options;
    this.suffix = options.suffix || '-frame.json';

    this.index = null;
  }

  readFrameIndex() {
    return this.source.readSync(this._xvizFrame(0));
  }

  readMetadata() {
    return this.source.readSync(this._xvizFrame(1));
  }

  readFrame(frameIndex) {
    // Data frames begin at the filename 2-frame.*
    return this.source.readSync(this._xvizFrame(2 + frameIndex));
  }

  // Support various formatted frame names
  _xvizFrame(index) {
    if (index === 0) {
      // index file is always json
      return `0-frame.json`;
    }

    return `${index}${this.suffix}`;
  }

  close() {
    this.source.close();
  }
}
