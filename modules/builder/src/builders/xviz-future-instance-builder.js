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
import XVIZPrimitiveBuilder from './xviz-primitive-builder';
import {insertTimestamp} from '../utils';
import {CATEGORY} from './constant';

export default class XVIZFutureInstanceBuilder extends XVIZPrimitiveBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.FUTURE_INSTANCE
    });

    this.reset();
    // futures: {[streamId]: {...,timestamps: [], primitives: []}}
    this._futures = {};
  }

  _timestamp(timestamp) {
    this._ts = timestamp;
    return this;
  }

  _flush() {
    let future = this._futures[this._streamId];
    if (!future) {
      future = {
        timestamps: [],
        primitives: []
      };
      this._futures[this._streamId] = future;
    }

    const primitive = this._formatPrimitive();

    const {timestamps, primitives} = future;

    // Each type like "image" has an "images" array, this hack saves a
    // big switch statement.
    const update = {};
    update[`${this._type}s`] = [primitive];

    // insert ts and primitive to the position based on timestamp order
    insertTimestamp(timestamps, primitives, this._ts, `${this._type}s`, primitive);

    this.reset();
  }

  getData() {
    if (this._type) {
      this._flush();
    }

    if (Object.keys(this._futures).length === 0) {
      return null;
    }

    return this._futures;
  }

  reset() {
    super.reset();
  }
}
