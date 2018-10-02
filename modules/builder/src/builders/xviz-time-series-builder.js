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

import {CATEGORY} from './constant';
import XVIZValuesBuilder from './xviz-values-builder';

export default class XVIZTimeSeriesBuilder extends XVIZValuesBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.time_series
    });

    this._values = [];
  }

  value(value) {
    if (value instanceof Array) {
      this.validateError('Input `value` should be single value');
    }

    this.validatePropSetOnce('_values');

    this._values.push(value);
    this._type = this.getVariableType(value);

    return this;
  }

  timestamp(timestamp) {
    if (timestamp instanceof Array) {
      this.validateError('Input `timestamp` should be a single value');
    }

    this.validatePropSetOnce('_timestamps');

    this._timestamps = [timestamp];

    return this;
  }
}
