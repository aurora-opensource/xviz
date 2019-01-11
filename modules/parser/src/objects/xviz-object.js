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

import {Vector2} from 'math.gl';

import BaseObject from './base-object';
import {getCentroid} from '../utils/geometry';

let defaultCollection = null;
let serialIndex = 0;

/**
 * Contains metadata and state of each XVIZ object
 */
export default class XVIZObject extends BaseObject {
  static setDefaultCollection(collection) {
    defaultCollection = collection;
  }

  constructor({id, timestamp}) {
    super();

    /* Persistent */
    this.id = id;
    this.index = serialIndex++;
    this.state = {};
    this.startTime = timestamp;
    this.endTime = timestamp;

    // Use Map here for the clear() method without creating a new object
    this._props = new Map();
    this._streams = new Map();
    this._geometry = null;
  }

  static observe(id, timestamp) {
    return defaultCollection && defaultCollection.observe(id, timestamp);
  }
  static get(id) {
    return defaultCollection && defaultCollection.get(id);
  }
  static clear() {
    return defaultCollection && defaultCollection.clear();
  }
  static count() {
    return defaultCollection && defaultCollection.count();
  }
  static resetAll() {
    return defaultCollection && defaultCollection.resetAll();
  }
  static getAll() {
    return defaultCollection && defaultCollection.getAll();
  }
  static getAllInCurrentFrame() {
    return defaultCollection && defaultCollection.getAllInCurrentFrame();
  }
  static prune(startTime, endTime) {
    return defaultCollection && defaultCollection.prune(startTime, endTime);
  }

  // returns a single tracking point for this object
  get position() {
    const p = this._geometry;
    if (!p) {
      return null;
    }
    if (Number.isFinite(p[0])) {
      return p;
    }
    this._geometry = getCentroid(p);
    return this._geometry;
  }

  // this prop is cleared every time `reset` is called
  get isValid() {
    return Boolean(this._geometry);
  }

  get streamNames() {
    return this._streams.keys();
  }

  getBearingToObject(object) {
    const myPosition = this.position;
    const otherPosition = object.position;

    if (myPosition && otherPosition) {
      // Look at the other object
      // TODO - handle degenerate case when in same position
      const bearing =
        (Math.atan2(otherPosition[1] - myPosition[1], otherPosition[0] - myPosition[0]) / Math.PI) *
        180;

      return bearing;
    }

    return null;
  }

  // Helper, calculates distance from specified XVIZ object to car
  // 2D distance only, ignores z coordinate
  getDistanceToObject(object) {
    const myPosition = this.position;
    const otherPosition = object.position;

    let distance = null;

    if (myPosition && otherPosition) {
      // TODO - calc distance to object trackingPoint
      // Ultimately distance might be desired as between closest surface points
      // We must disregard height to compensate for other choices in our ingestion stack
      distance = new Vector2(myPosition).distance(otherPosition);
      distance = Math.round(distance * 10) / 10;
    }

    return distance;
  }

  getProp(name) {
    return this._props.get(name);
  }

  getFeature(streamName) {
    return this._streams.get(streamName);
  }

  // PRIVATE METHODS

  _observe(timestamp) {
    this.startTime = Math.min(this.startTime, timestamp);
    this.endTime = Math.max(this.endTime, timestamp);
  }

  _addFeature(streamName, feature) {
    this._streams.set(streamName, feature);

    // populate the feature with object props
    feature.index = this.index;
    feature.state = this.state;
    for (const entry of this._props) {
      feature[entry[0]] = entry[1];
    }

    // save feature geometry for tracking
    const p = feature.center || feature.vertices;

    if (!p || !Array.isArray(p)) {
      return;
    }
    if (Number.isFinite(p[0])) {
      p[2] = p[2] || 0;
    } else if (this._geometry) {
      // Prefer point over point array
      return;
    }
    // store the point(s) as is
    this._geometry = p;
  }

  _setState(name, value) {
    if (name) {
      this.state[name] = value;
    }
  }

  _setProp(name, value) {
    this._props.set(name, value);
  }

  // This should be called at the beginning of `getCurrentFrame`
  _reset() {
    if (this._props.size) {
      this._props.clear();
    }
    if (this._streams.size) {
      this._streams.clear();
    }
    // clear the cached position
    this._geometry = null;
  }
}
