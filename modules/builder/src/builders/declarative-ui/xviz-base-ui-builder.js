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

import {snakeToCamel} from './utils';

export default class XvizBaseUiBuilder {
  constructor({root, type}) {
    this._type = type;
    this._children = null;
    this._root = root;

    // end chaining of this builder and go back to root builder
    this[`${snakeToCamel(this._type)}Right`] = () => this._done();
  }

  // add child
  child(child) {
    if (!this._children) {
      this._children = [];
    }
    this._children.push(child);
    return this;
  }

  // start appending children to current UI element
  children() {
    return this._root;
  }

  getUI() {
    const obj = {type: this._type};
    if (this._children && this._children.length) {
      obj.children = this._children.map(child => child.getUI());
    }
    return obj;
  }

  // done with current UI element builder
  _done() {
    this._root.done();
    return this._root;
  }
}
