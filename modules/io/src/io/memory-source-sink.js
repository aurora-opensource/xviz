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
/**
 * Memory storage for XVIZ data
 */
export class MemorySourceSink {
  constructor() {
    this.data = new Map();
  }

  readSync(name) {
    return this.data.get(name);
  }

  writeSync(name, data) {
    // Save the underlying arrayBuffer not the TypedArray
    // because when reading we should have an ArrayBuffer
    // and the consumer should make the Type decision
    if (ArrayBuffer.isView(data) && data.length && data.buffer) {
      this.data.set(name, data.buffer);
    } else {
      this.data.set(name, data);
    }
  }

  existsSync(name) {
    return this.data.has(name);
  }

  close() {}

  entries() {
    return this.data.entries();
  }

  has(name) {
    return this.data.has(name);
  }
}
