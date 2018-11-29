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

import assert from '../utils/assert';

export const INSERT_POSITION = {
  LEFT: 0,
  RIGHT: 1
};

const defaultTimestampAccessor = timeslice => timeslice.timestamp;

/**
 * Binary search on sorted timeslices
 * @params {Array} timeslices which elements contain a 'timestamp' property
 * @params {number} timestamp
 * @params {number} insertPosition - insert to the left or right of the equal element.
 * @params {number} timestampAccessor - access the timestamp of the timeslice elements
 * @returns {number} index of insert position
 */
export function findInsertPos(
  timeslices,
  timestamp,
  insertPosition = INSERT_POSITION.LEFT,
  timestampAccessor = defaultTimestampAccessor
) {
  assert(Number.isFinite(timestamp), 'valid timeslice search timestamp');

  let lowerBound = 0;
  let upperBound = timeslices.length - 1;
  let currentIndex;
  let currentTimestamp;

  while (lowerBound <= upperBound) {
    currentIndex = ((lowerBound + upperBound) / 2) | 0;
    currentTimestamp = timestampAccessor(timeslices[currentIndex]);

    if (currentTimestamp < timestamp) {
      lowerBound = currentIndex + 1;
    } else if (currentTimestamp > timestamp) {
      upperBound = currentIndex - 1;
    } else {
      return insertPosition === INSERT_POSITION.LEFT ? currentIndex : currentIndex + 1;
    }
  }

  return lowerBound;
}
