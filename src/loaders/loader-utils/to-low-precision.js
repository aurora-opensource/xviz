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

/**
 * Covert all numbers in a deep structure to a given precision, allowing
 * reliable float comparisons. Converts data in-place.
 * @param  {mixed} input      Input data
 * @param  {Number} [precision] Desired precision
 * @return {mixed}            Input data, with all numbers converted
 */
export function toLowPrecision(input, precision = 11) {
  /* eslint-disable guard-for-in */
  if (typeof input === 'number') {
    input = Number(input.toPrecision(precision));
  } else if (Array.isArray(input) || ArrayBuffer.isView(input)) {
    input = Array.from(input).map(item => toLowPrecision(item, precision));
  } else if (typeof input === 'object') {
    for (const key in input) {
      input[key] = toLowPrecision(input[key], precision);
    }
  }
  return input;
}
