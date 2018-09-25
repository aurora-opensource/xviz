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

import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizPlotBuilder extends XvizBaseUiBuilder {
  constructor({independentVariable, dependentVariable, root}) {
    super({
      root,
      type: UI_TYPES.PLOT
    });
    this._independentVariable = independentVariable;
    this._dependentVariable = dependentVariable;
  }

  description(description) {
    this._description = description;
    return this;
  }

  title(title) {
    this._title = title;
    return this;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
  }

  getUI() {
    const obj = super.getUI();
    obj.streams = this._streams;
    obj.independentVariable = this._independentVariable;
    obj.dependentVariable = this._dependentVariable;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
