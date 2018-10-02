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

export default class XVIZBaseBuilder {
  constructor({validator, category, metadata}) {
    this.category = category;
    this.metadata = metadata;

    this._validator = validator;
  }

  stream(streamId) {
    if (this.streamId) {
      this.flush();
    }

    this.streamId = streamId;
    return this;
  }

  getStreamId() {
    return this.streamId;
  }

  getCategory() {
    return this.category;
  }

  getMetadata() {
    return this.metadata;
  }

  reset() {
    this.streamId = null;
    this.category = null;
  }

  flush() {}

  getData() {
    return null;
  }

  validate() {
    this._validator.hasProp(this, 'streamId');
    this._validator.hasProp(this, 'category');
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
