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

import {getXVIZConfig} from '../config/xviz-config';
import xvizStats from '../utils/stats';
import LogSlice from './log-slice';

import memoize from '../utils/memoize';
import assert from '../utils/assert';

// MEMOIZATION OF LOGSLICE CONSTRUCTOR AND GET METHOD
const getCurrentLogSliceMemoized = memoize((streamFilter, lookAheadMs, ...streamsByReverseTime) => {
  xvizStats.bump('getCurrentLogSliceMemoized');
  return new LogSlice(streamFilter, lookAheadMs, streamsByReverseTime);
});

const getCurrentFrameMemoized = memoize(
  (logSlice, vehiclePose, trackedObjectId, postProcessFrame) => {
    return logSlice.getCurrentFrame({vehiclePose, trackedObjectId}, postProcessFrame);
  }
);

/**
 * Synchronizes log data across streams and provide the latest data
 * "closest" to a given timestamp within a time window.
 *
 * NOTES:
 * - logs typically use GPS time (no leap seconds)
 *   - Definition: http://www.leapsecond.com/java/gpsclock.htm
 *   - Web conversion: https://www.andrews.edu/~tzs/timeconv/timeconvert.php
 *   - Javascript conversion: https://www.npmjs.com/package/gps-time
 * - should vehicle_pose be selected based on time closes to the set time?
 *   It remains unclear what stream data is derived from which vehicle_pose
 *   due to the propogation of data thru the system.
 *
 * @param {Object[]} slices - Array of timeslices
 * - Each timeslice object must contain a GPS timestamp
 */
export default class BaseSynchronizer {
  constructor(opts = {}) {
    this.opts = opts;

    this.time = 0;
    this.loResTime = 0;
    this.lookAheadMs = 0;
  }

  // The "frame" contains the processed and combined data from the current log slice
  getCurrentFrame(streamFilter, trackedObjectId) {
    xvizStats.bump('getCurrentFrame');

    const logSlice = this.getLogSlice(streamFilter);
    if (!logSlice) {
      return null;
    }

    const {PRIMARY_POSE_STREAM, ALLOW_NO_PRIMARY_POSE} = getXVIZConfig();
    // If a missing primary pose stream is allowed, then set the default pose
    // value to origin.
    const defaultPose = ALLOW_NO_PRIMARY_POSE ? {x: 0, y: 0, z: 0} : null;
    const vehiclePose = logSlice.getStream(PRIMARY_POSE_STREAM, defaultPose);

    if (vehiclePose !== this._lastVehiclePose) {
      xvizStats.bump('vehiclePose');
      this._lastVehiclePose = vehiclePose;
    }

    return getCurrentFrameMemoized(
      logSlice,
      vehiclePose,
      trackedObjectId,
      this.opts.postProcessFrame
    );
  }

  // @return {Number} Currently set time
  getTime() {
    return this.time;
  }

  // The low resolution time is rounded to bigger intervals, throttling updates
  getLoResTime() {
    return this.loResTime;
  }

  /**
   * @param {Number} time - time to synchronize the logs with
   * @return {StreamSynchronizer} - returns itself for chaining.
   */
  setTime(time) {
    const {PLAYBACK_FRAME_RATE} = getXVIZConfig();
    this.time = time;
    this.loResTime = Math.round(time * PLAYBACK_FRAME_RATE) / PLAYBACK_FRAME_RATE;
    assert(Number.isFinite(this.time), 'Invalid time');
    return this;
  }

  /**
   * Set the lookAhead time offset.
   *
   * @param {Number} offset - milliseconds into the future
   * @return {LogSynchronizer} - returns itself for chaining
   */
  setLookAheadTimeOffset(offset) {
    // Change the offset time into an index.
    this.lookAheadMs = offset;
    return this;
  }

  // HELPER METHODS

  // Get data for current time...
  // @return {Object} - keys are stream names
  //  values are the datum from each stream that best matches the current time.
  getLogSlice(streamFilter) {
    if (this._empty()) {
      return null;
    }

    // Find the right timeslices
    const {TIME_WINDOW} = getXVIZConfig();
    this._lastLoResTime = this.loResTime;
    this._streamsByReverseTime = this._getTimeRangeInReverse(
      this.loResTime - TIME_WINDOW,
      this.loResTime
    );
    xvizStats.bump('geometry-refresh');

    return getCurrentLogSliceMemoized(
      streamFilter,
      this.lookAheadMs,
      ...this._streamsByReverseTime
    );
  }

  // PROTECTED API - DEFINED BY DERIVED CLASES

  empty() {
    assert(false);
  }

  /**
   * Find and process stream data in the range (start, end] for process
   * Returns a list of streams sorted by descending time
   * Since we have all samples and can find the exact datum for the stream i
   * there is no "range" of samples to process and the reverse ordering does not apply.
   * @param Number startTime - The time to start from.
   * @param Number endTime - The time to end at.
   */
  _getTimeRangeInReverse(startTime, endTime) {
    assert(false);
  }
}
