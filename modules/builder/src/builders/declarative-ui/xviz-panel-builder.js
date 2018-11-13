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

export default class XVIZPanelBuilder extends XVIZBaseUiBuilder {
  constructor({name, layout, interactions, validateWarn, validateError}) {
    super({
      type: UI_TYPES.PANEL,
      validateWarn,
      validateError
    });
    this._name = name;
    this._layout = layout;
    this._interactions = interactions;

    this._validate();
  }

  _validate() {
    if (!this._name) {
      this._validateError('Panel should have `name`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.name = this._name;

    if (this._layout) {
      obj.layout = this._layout;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
