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

import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XVIZPlotBuilder extends XVIZBaseUiBuilder {
  constructor({
    independentVariable,
    dependentVariables,
    regions,
    description,
    title,
    validateWarn,
    validateError
  }) {
    super({
      type: UI_TYPES.PLOT,
      validateWarn,
      validateError
    });
    this._independentVariable = independentVariable;
    this._dependentVariables = dependentVariables;
    this._regions = regions;
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (this._independentVariable) {
      if (!this._dependentVariables) {
        this._validateError('Plot should have `dependentVariables`.');
      }
    } else if (!this._regions) {
      this._validateError('Plot should have either `independentVariable` or `regions`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    if (this._independentVariable) {
      obj.independentVariable = this._independentVariable;
      obj.dependentVariables = this._dependentVariables;
    }

    if (this._regions) {
      obj.regions = this._regions;
    }

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
