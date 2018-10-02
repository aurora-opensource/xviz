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

import {CATEGORY, VARIABLE_TYPES} from './constant';
import XVIZValuesBuilder from './xviz-values-builder';

export default class XvizVariableBuilder extends XVIZValuesBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.variable
    });
  }

  timestamps(timestamps) {
    if (!(timestamps instanceof Array)) {
      this.validateError('Input `timestamps` should be array');
    }

    this.validatePropSetOnce('_timestamps');

    this._timestamps = timestamps;

    return this;
  }

  values(values) {
    if (!(values instanceof Array)) {
      this.validateError('Input `values` should be array');
    }

    this.validatePropSetOnce('_values');

    this._values = values;
    this._type = this._getValuesType(values);

    return this;
  }

  _getValuesType(values) {
    let types = values.map(v => this.getVariableType(v)).filter(Boolean);
    types = Array.from(new Set(types)).sort();

    if (types.length === 0) {
      this.validateWarn(`stream ${this.streamId}: values types are not recognized.`);
      return null;
    } else if (types.length === 1) {
      return types[0];
    } else if (
      // javascript treat 2.0 as 2 (Integer), 1.1 as float
      // so if list of value has both `float` and `integer`, consider as `float`
      types.length === 2 &&
      types.join(',') === [VARIABLE_TYPES.float, VARIABLE_TYPES.integer].join(',')
    ) {
      return VARIABLE_TYPES.float;
    }

    this.validateWarn(`stream ${this.streamId}: values type ${types.join(',')} are not consistent`);
    return null;
  }
}
