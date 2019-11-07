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
 * Class to abstract away file IO
 */
export class FileSource {
  constructor(root) {
    this.fs = module.require('fs');
    this.path = module.require('path');
    this.root = root;
  }

  readSync(name) {
    const path = this.path.join(this.root, name);
    if (this.fs.existsSync(path)) {
      return this.fs.readFileSync(path);
    }

    return undefined;
  }

  existsSync(name) {
    const path = this.path.join(this.root, name);
    return this.fs.existsSync(path);
  }

  close() {}
}
