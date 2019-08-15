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

/* XVIZSessionContext provides state shared across
 * a session.  It includes both general state about
 * the session as well as a store for middleware state
 * if necessary.
 */
export class XVIZSessionContext {
  constructor(state = {}) {
    this.map = new Map(Object.entries(state));
    this.activeTransforms = new Map();
  }

  set(name, val) {
    this.map.set(name, val);
  }

  get(name) {
    return this.map.get(name);
  }

  startTransform(id, state) {
    this.activeTransforms.set(id, state);
  }

  transforms() {
    return this.activeTransforms.keys();
  }

  transform(id) {
    return this.activeTransforms.get(id);
  }

  endTransform(id) {
    this.activeTransforms.delete(id);
  }
}
