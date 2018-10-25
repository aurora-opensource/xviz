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

/* XVIZBaseBuilder provides validation and category information
 * shared across all builders.
 */
export default class XVIZBaseBuilder {
  constructor({validator, category, metadata}) {
    this._streamId = null;
    this._category = category;
    this._metadata = metadata;

    this._validator = validator;
  }

  stream(streamId) {
    if (this._streamId) {
      this._flush();
    }

    this._streamId = streamId;
    return this;
  }

  getStreamId() {
    return this._streamId;
  }

  getCategory() {
    return this._category;
  }

  getMetadata() {
    return this._metadata;
  }

  _flush() {
    throw new Error('Derived class must implement the "_flush()" method.');
  }

  _reset() {
    this._category = null;
  }

  _validate() {
    this._validator.hasProp(this, '_streamId');
    this._validator.hasProp(this, '_category');
    this._validator.matchMetadata(this);
  }

  validateWarn(msg) {
    this._validator.warn(msg);
  }

  validateError(msg) {
    this._validator.error(msg);
  }

  validatePropSetOnce(prop) {
    this._validator.propSetOnce(this, prop);
  }
}
