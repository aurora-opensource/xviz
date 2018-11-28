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
 * Find existing timestamp or insert a new one. The 'values' arrays is a parallel index
 * where the primitives will be added.
 *
 * Primitives will be merged by 'key'
 * @param timestamps list of sorted timestamps
 * @param values list of values sorted based on timestamps
 * @param ts
 * @param value
 */
export function insertTimestamp(timestamps, values, ts, key, value) {
  // Find number that equals the timestamp
  const targetIndex = timestamps.findIndex(x => Math.abs(x - ts) < Number.EPSILON);
  if (targetIndex !== -1) {
    // Add to existing entry
    const primitives = values[targetIndex];
    if (!primitives[key]) {
      primitives[key] = [];
    }

    primitives[key].push(value);
  } else {
    // Insert new entry
    let insertIndex = timestamps.findIndex(x => x > ts);
    if (insertIndex === -1) {
      insertIndex = timestamps.length;
    }

    timestamps.splice(insertIndex, 0, ts);
    const primitives = {
      [key]: [value]
    };
    values.splice(insertIndex, 0, primitives);
  }
}
