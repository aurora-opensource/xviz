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

import BaseSynchronizer from './base-synchronizer';

export default class StreamSynchronizer extends BaseSynchronizer {
  /**
   * @classdesc
   * Lets the application do synchronized walks through a set of time slices
   * and allows the app to get the data object closes to a given time.
   *
   * @class
   * @param Number startTime - The starting GPS time
   * @param {XVIZStreamBuffer} streamBuffer - The stream buffer
   * - Each timeslice object must contain a GPS timestamp
   */
  constructor(streamBuffer, opts) {
    super(opts);

    this.streamBuffer = streamBuffer;
  }

  _empty() {
    return !this.streamBuffer || !this.streamBuffer.size;
  }

  /**
   * Find and process stream data in the range (start, end] for process
   * Returns a list of streams sorted by decending time
   *
   * @param Number startTime - The time to start from.
   * @param Number endTime - The time to end at.
   */
  _getTimeRangeInReverse(startTime, endTime) {
    const slices = this.streamBuffer.getTimeslices({start: startTime, end: endTime}).reverse();
    return {
      streams: slices.map(timeslice => timeslice.streams).filter(Boolean),
      links: slices.map(timeslice => timeslice.links).filter(Boolean)
    };
  }
}
