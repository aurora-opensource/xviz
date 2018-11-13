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

export default class XVIZVideoBuilder extends XVIZBaseUiBuilder {
  constructor({cameras, interactions, validateWarn, validateError}) {
    super({
      type: UI_TYPES.VIDEO,
      validateWarn,
      validateError
    });
    this._cameras = cameras;

    this._validate();
  }

  _validate() {
    if (!this._cameras) {
      this._validateError('Video component should have `cameras`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.cameras = this._cameras;

    return obj;
  }
}
