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

/* eslint-disable camelcase */
import XVIZBaseBuilder from './xviz-base-builder';
import {CATEGORY} from './constant';

export default class XVIZPoseBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.POSE
    });

    this._poses = null;
  }

  mapOrigin(longitude, latitude, altitude) {
    this._map_origin = {longitude, latitude, altitude};
    return this;
  }

  position(x, y, z) {
    this._position = [x, y, z];
    return this;
  }

  orientation(roll, pitch, yaw) {
    this._orientation = [roll, pitch, yaw];
    return this;
  }

  timestamp(timestamp) {
    this._timestamp = timestamp;
    return this;
  }

  _flush() {
    if (!this._poses) {
      this._poses = {};
    }

    const data = {};
    if (this._timestamp) {
      data.timestamp = this._timestamp;
    }

    if (this._map_origin) {
      data.map_origin = this._map_origin;
    }

    if (this._position) {
      data.position = this._position;
    }

    if (this._orientation) {
      data.orientation = this._orientation;
    }

    this._poses[this._streamId] = data;
  }

  reset() {
    super.reset();

    this._timestamp = null;
    this._map_origin = null;
    this._position = null;
    this._orientation = null;
  }

  getData() {
    if (this._streamId) {
      this._flush();
    }

    return {
      poses: this._poses
    };
  }
}
