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

import XVIZObject from './xviz-object';

export default class XVIZObjectCollection {
  constructor({ObjectType = XVIZObject} = {}) {
    // A map of all XVIZ objects, across time
    this.objects = new Map();
    this.ObjectType = ObjectType;
  }

  // Drop all XVIZ objects
  clear() {
    this.objects.clear();
  }

  count() {
    return this.objects.size;
  }

  // Create a new XVIZ object at timestamp if it does not exist.
  observe(id, timestamp) {
    if (id === undefined || id === null) {
      return;
    }
    // Map keys use strict equal
    id = id.toString();
    if (this.objects.has(id)) {
      const object = this.objects.get(id);
      object._observe(timestamp);
    } else {
      const object = new this.ObjectType({id, timestamp});
      this.objects.set(id, object);
    }
  }

  get(id) {
    if (id === undefined || id === null) {
      return null;
    }
    // Map keys use strict equal
    id = id.toString();
    return this.objects.get(id) || null;
  }

  // Clears all XVIZ object props for a fresh new frame.
  resetAll() {
    this.objects.forEach(object => object._reset());
  }

  // Returns all XVIZ objects
  getAll() {
    const result = {};
    this.objects.forEach((object, id) => {
      result[id] = object;
    });
    return result;
  }

  // Returns all XVIZ objects present in current frame
  getAllInCurrentFrame() {
    const result = {};
    this.objects.forEach((object, id) => {
      if (object.isValid) {
        result[id] = object;
      }
    });
    return result;
  }

  // Removes XVIZ objects that are outside of a time window
  prune(startTime, endTime) {
    const {objects} = this;
    const idsToRemove = [];

    objects.forEach((object, id) => {
      if (object.endTime < startTime || object.startTime > endTime) {
        idsToRemove.push(id);
      }
    });
    idsToRemove.forEach(id => {
      objects.delete(id);
    });
  }
}
