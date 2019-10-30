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

import assert from '../utils/assert';

export default class LogSynchronizer extends BaseSynchronizer {
  /**
   * @classdesc
   * The log streams are arrays of timestamped data objects, and the app
   * will access the data object from each stream that is in the time range
   * covering our current timestep.
   *
   * @class
   * @param {Object} logs - Map of logs (arrays) with elements
   * - Keys will be used as names of logs, and the extracted data will be
   *   placed in a field with that name.
   * - Each log is expected to be an array of objects.
   * - Each log object must contain a GPS timestamp
   *   either in the `attributes.transmission_time` or the `time` fields
   */
  constructor(logs = {}, opts) {
    super(opts);

    // Set up log state for all logs, so that we can move forward and back
    this.logs = {};

    for (const logName in logs) {
      const data = logs[logName];
      assert(Array.isArray(data) && data.length > 0, 'Invalid log data');
      const logStartTime = this._getTimeFromObject(data[0]);
      this.logs[logName] = {
        data,
        index: null, // index holds the indices to process
        time: logStartTime // used to optimize lookup
      };
    }
  }

  _empty() {
    return !this.logs || Object.keys(this.logs).length === 0;
  }

  /**
   * Find and process stream data in the range (start, end] for process
   * Returns a list of streams sorted by decending time
   *
   * Since we have all samples and can find the correct datum for every stream
   * and only send back an array of 1 element. To do this we will apply the
   * reverse search here, stopping when we find the entry closest to endTime.
   *
   * @param Number startTime - The time to start from.
   * @param Number endTime - The time to end at.
   */
  _getTimeRangeInReverse(startTime, endTime) {
    const streams = {};

    // Set index based on time range for each stream
    for (const logName in this.logs) {
      const datum = this._lookupStreamDatum(logName, startTime, endTime);
      if (datum) {
        streams[logName] = datum;
      }
    }

    return {streams: [streams], links: []};
  }

  /**
   * @private
   * Lookups the datum for a stream within the time range.
   *
   * This is a mutating function as it tracks last lookup state to
   * optimize for sequential lookups
   *
   * @param {String} logName - which log to sync
   * @param {Number} startTime - start of time to include data from
   * @param {Number} endTime - end time to limit data within
   * @return {Object} - returns datum for this log or null
   */
  _lookupStreamDatum(logName, startTime, endTime) {
    const log = this.logs[logName];
    assert(log, 'Invalid log');

    // This is an optimization for positive time deltas (playing forward)
    // If going backwards, just reset and perform full search.
    if (endTime < log.time) {
      log.time = 0;
      log.index = null;
    }

    const startIndex = log.index || 0;
    let endIndex = null;
    let endTimestamp;

    // invalidate
    log.index = null;

    // Find the range of indices for the given start and end time
    for (let i = startIndex; i < log.data.length; ++i) {
      const timestamp = this._getTimeFromObject(log.data[i]);
      // If timestamp < startTime, sample before our target window, so don't update index
      if (timestamp > startTime && timestamp <= endTime) {
        // Within our target window, so update index
        endIndex = i;
        endTimestamp = timestamp;
      } else if (timestamp > endTime) {
        // Beyond our target window, so exit early
        break;
      }
    }

    // Found no entry
    if (endIndex === null) {
      return null;
    }

    log.index = endIndex;
    log.time = endTimestamp;
    return log.data[endIndex];
  }

  _getTimeFromObject(object) {
    return object.time || (object.attributes && object.attributes.transmission_time);
  }
}
