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

import XVIZObject from '../objects/xviz-object';
import assert from '../utils/assert';
import {findInsertPos, INSERT_POSITION} from '../utils/search';

// Insert positions
const LEFT = INSERT_POSITION.LEFT;
const RIGHT = INSERT_POSITION.RIGHT;

// Buffer types
const UNLIMITED = 0;
const OFFSET = 1;
const FIXED = 2;

export default class XVIZStreamBuffer {
  /**
   * constructor
   * @param {object} options
   * @param {number} options.startOffset - desired start of buffer to keep in memory
   *  relative to the current time.
   * @param {number} options.endOffset - desired end of buffer to keep in memory
   *  relative to the current time.
   */
  constructor({startOffset = null, endOffset = null, maxLength = null} = {}) {
    if (Number.isFinite(startOffset) && Number.isFinite(endOffset)) {
      assert(startOffset <= 0 && endOffset >= 0, 'Steam buffer offset');
      this.bufferType = OFFSET;
    } else {
      this.bufferType = UNLIMITED;
    }

    this.options = {
      startOffset,
      endOffset,
      maxLength
    };

    /* Desired buffer range, in timestamps */
    this.bufferStart = null;
    this.bufferEnd = null;
    /* Sorted timeslices */
    this.timeslices = [];
    this.persistent = []; // like timeslices, but never pruned
    /* Sorted values by stream */
    this.streams = {};
    this.videos = {};
    this.persistentStreams = {};
    /* Update counter */
    this.lastUpdate = 0;
    /* Track the number of unique streams */
    this.streamCount = 0;

    this.hasBuffer = this.hasBuffer.bind(this);
  }

  /**
   * @property {number} the count of timeslices in buffer
   */
  get size() {
    return this.timeslices.length + this.persistent.length;
  }

  /**
   * updates the fixed buffer range, capping it to maxLength if set
   * @param {number} start - desired fixed start time of buffer to keep in memory
   * @param {number} end - desired fixed end time of buffer to keep in memory
   * @returns {start: number, end: number, oldStart: number, oldEnd: number} - the old and new buffer ranges
   */
  updateFixedBuffer(start, end) {
    const {
      bufferStart,
      bufferEnd,
      options: {maxLength}
    } = this;
    assert(start < end, 'updateFixedBuffer start / end');
    assert(
      this.bufferType === UNLIMITED || this.bufferType === FIXED,
      'updateFixedBuffer multiple buffer types'
    );
    this.bufferType = FIXED;

    if (!maxLength) {
      // If we have no limits on buffer size, just use the new provided values
      this.bufferStart = start;
      this.bufferEnd = end;
    } else if (
      !Number.isFinite(bufferStart) ||
      start > bufferEnd + maxLength ||
      start < bufferStart - maxLength
    ) {
      // If we have a limit but this is our first range definition, or this is so far before the existing
      // buffer that there's no overlap, use the provided start and determine end based on max buffer length
      this.bufferStart = start;
      this.bufferEnd = Math.min(end, start + maxLength);
    } else if (start < bufferStart) {
      // If this is before the existing buffer but close enough to have overlap, use the provided start
      // and determine the end based on max buffer length and the existing buffer end
      this.bufferStart = start;
      this.bufferEnd = Math.min(bufferEnd, start + maxLength);
    } else {
      // Otherwise, we're past the end of the existing buffer and either extend the existing buffer
      // or start a new buffer based on maxLength
      this.bufferStart = Math.min(bufferEnd, end - maxLength);
      this.bufferEnd = Math.min(this.bufferStart + maxLength, end);
    }
    this._pruneBuffer();
    return {start: this.bufferStart, end: this.bufferEnd, oldStart: bufferStart, oldEnd: bufferEnd};
  }

  /**
   * Gets the time range that the buffer is accepting data for
   * @returns {object} - {start | null, end | null} timestamps if any timeslice is loaded
   */
  getBufferRange() {
    if (this.bufferType !== UNLIMITED) {
      const {bufferStart, bufferEnd} = this;
      if (Number.isFinite(bufferStart)) {
        // buffer range should be ignored if setCurrentTime has not been called
        return {start: bufferStart, end: bufferEnd};
      }
    }
    return {start: null, end: null};
  }

  /**
   * Gets the buffered time range
   * @returns {object | null} - {start, end} timestamps if any timeslice is loaded
   */
  getLoadedTimeRange() {
    // TODO what about persistent?
    const {timeslices} = this;
    const len = timeslices.length;

    if (len > 0) {
      return {
        start: timeslices[0].timestamp,
        end: timeslices[len - 1].timestamp
      };
    }
    return null;
  }

  /**
   * Gets timeslices within a given time range.
   * @params {number, optional} start - start timestamp (inclusive)
   * @params {number, optional} end - end timestamp (inclusive)
   * @returns {array} - loaded timeslices within range
   */
  getTimeslices({start, end} = {}) {
    const {timeslices, persistent} = this;
    const startIndex = Number.isFinite(start) ? this._indexOf(start, LEFT) : 0;
    const endIndex = Number.isFinite(end) ? this._indexOf(end, RIGHT) : timeslices.length;
    const persistentEndIndex = Number.isFinite(end)
      ? findInsertPos(persistent, end, RIGHT)
      : persistent.length;

    return persistent.slice(0, persistentEndIndex).concat(timeslices.slice(startIndex, endIndex));
  }

  /**
   * Deprecated for perf reasons
   * Gets loaded stream slices within the current buffer
   */
  getStreams() {
    const {streams} = this;
    const result = {};
    for (const streamName in streams) {
      result[streamName] = streams[streamName].filter(value => value !== undefined);
    }
    return result;
  }

  /**
   * Gets loaded video frames within the current buffer
   */
  getVideos() {
    const {videos} = this;
    const result = {};
    for (const streamName in videos) {
      result[streamName] = videos[streamName].filter(value => value !== undefined);
    }
    return result;
  }

  /**
   * Get vehicle poses within the current buffer
   */
  getVehiclePoses() {
    return this.timeslices.map(t => t.vehiclePose).filter(Boolean);
  }

  /**
   * Add a new timeslice object into the timeline
   * @params {object} timeslice - timeslice object from XVIZ stream
   */
  // eslint-disable-next-line complexity, max-statements
  insert(timeslice) {
    const {timestamp, updateType} = timeslice;

    if (!this.isInBufferRange(timestamp)) {
      return false;
    }

    // backwards compatibility - normalize time slice
    timeslice.streams = timeslice.streams || {};
    timeslice.videos = timeslice.videos || {};
    timeslice.links = timeslice.links || {};

    const {timeslices, streams, videos} = this;

    if (updateType === 'PERSISTENT') {
      this._insertPersistentSlice(timeslice);
      this.lastUpdate++;
      return true;
    }

    // Note: if stream is not present in a timeslice, that index in the list holds undefined
    // This avoids repeatedly allocating new arrays for each stream, and lowers the cost of
    // insertion/deletion, which can be a significant perf hit depending on frame rate and
    // buffer size.
    for (const streamName in timeslice.streams) {
      if (!streams[streamName]) {
        streams[streamName] = new Array(timeslices.length);
        this.streamCount++;
      }
    }
    for (const streamName in timeslice.videos) {
      if (!videos[streamName]) {
        videos[streamName] = new Array(timeslices.length);
      }
    }

    const insertPosition = this._indexOf(timestamp, LEFT);
    const timesliceAtInsertPosition = timeslices[insertPosition];

    if (timesliceAtInsertPosition && timesliceAtInsertPosition.timestamp === timestamp) {
      // Same timestamp
      if (updateType === 'COMPLETE') {
        // Replace if it's a complete state
        this._insertTimesliceAt(insertPosition, 1, timeslice);
      } else {
        // Merge if it's an incremental update (default)
        this._mergeTimesliceAt(insertPosition, timeslice);
      }
    } else {
      this._insertTimesliceAt(insertPosition, 0, timeslice);
    }

    this.lastUpdate++;
    return true;
  }

  /**
   * Set the current timestamp
   * May drop timeslices that are not in range
   * @params {number} timestamp - timestamp of the playhead
   */
  setCurrentTime(timestamp) {
    if (this.bufferType === OFFSET) {
      const {
        options: {startOffset, endOffset}
      } = this;
      this.bufferStart = timestamp + startOffset;
      this.bufferEnd = timestamp + endOffset;
      this._pruneBuffer();
    }
  }

  /**
   * Override Object.prototype.valueOf
   * This is used to trigger a selector update without creating a new XVIZStreamBuffer instance
   */
  valueOf() {
    return this.lastUpdate;
  }

  /**
   * Provide interface for video-synchronizer to test for valid gps-based time range data.
   *
   * @params {number} fromTime is the gps time start of data
   * @params {number} toTime is the gps time end of data
   * @returns {bool} If we have no data, always return true, else true is returned
   *                 if the time range is satisfied
   */
  hasBuffer(fromTime, toTime) {
    // TODO: persistent
    if (!this.timeslices.length) {
      return true;
    }
    const {start, end} = this.getLoadedTimeRange();
    return fromTime >= start && toTime <= end;
  }

  /**
   * Check if a timestamp is inside the desired buffer range
   * @params {number} timestamp
   * @returns {bool}
   */
  isInBufferRange(timestamp) {
    const {bufferStart, bufferEnd, bufferType} = this;
    if (bufferType !== UNLIMITED && Number.isFinite(bufferStart)) {
      return timestamp >= bufferStart && timestamp <= bufferEnd;
    }
    return true;
  }

  /* eslint-disable complexity, no-unused-expressions */
  _pruneBuffer() {
    const {timeslices, streams, videos} = this;

    if (timeslices.length) {
      const startIndex = this._indexOf(this.bufferStart, LEFT);
      const endIndex = this._indexOf(this.bufferEnd, RIGHT);

      XVIZObject.prune(this.bufferStart, this.bufferEnd);

      const trimStart = startIndex > 0;
      const trimEnd = endIndex < timeslices.length;
      if (trimStart || trimEnd) {
        // Drop frames that are outside of the buffer
        trimEnd && timeslices.splice(endIndex);
        trimStart && timeslices.splice(0, startIndex);

        for (const streamName in streams) {
          const stream = streams[streamName];
          trimEnd && stream.splice(endIndex);
          trimStart && stream.splice(0, startIndex);
        }
        for (const streamName in videos) {
          const stream = videos[streamName];
          trimEnd && stream.splice(endIndex);
          trimStart && stream.splice(0, startIndex);
        }

        this.lastUpdate++;
      }
    }
  }
  /* eslint-enable complexity, no-unused-expressions */

  _insertPersistentSlice(persistentSlice) {
    const {persistent, persistentStreams} = this;
    const {timestamp, streams, links} = persistentSlice;
    const index = findInsertPos(persistent, timestamp, LEFT);
    const timesliceAtInsertPosition = persistent[index];

    if (timesliceAtInsertPosition && timesliceAtInsertPosition.timestamp === timestamp) {
      // merge
      Object.assign(timesliceAtInsertPosition, persistentSlice, {
        streams: Object.assign(timesliceAtInsertPosition.streams, streams),
        links: Object.assign(timesliceAtInsertPosition.links, links)
      });
    } else {
      // insert
      persistent.splice(index, 0, persistentSlice);
    }

    for (const streamName in streams) {
      if (!(streamName in persistentStreams)) {
        persistentStreams[streamName] = true;
        this.streamCount++;
      }
    }
  }

  _mergeTimesliceAt(index, timeslice) {
    const {timeslices, streams, videos} = this;
    const timesliceAtInsertPosition = timeslices[index];

    Object.assign(timesliceAtInsertPosition, timeslice, {
      streams: Object.assign(timesliceAtInsertPosition.streams, timeslice.streams),
      links: Object.assign(timesliceAtInsertPosition.links, timeslice.links),
      videos: Object.assign(timesliceAtInsertPosition.videos, timeslice.videos)
    });

    for (const streamName in timeslice.streams) {
      const value = timeslice.streams[streamName];
      streams[streamName][index] = value;
    }
    for (const streamName in timeslice.videos) {
      videos[streamName][index] = timeslice.videos[streamName];
    }
  }

  _insertTimesliceAt(index, deleteCount, timeslice) {
    const {timeslices, streams, videos} = this;

    timeslices.splice(index, deleteCount, timeslice);

    for (const streamName in streams) {
      streams[streamName].splice(index, deleteCount, timeslice.streams[streamName]);
    }

    for (const streamName in videos) {
      videos[streamName].splice(index, deleteCount, timeslice.videos[streamName]);
    }
  }

  /**
   * Return insert position for timeslice data given a timestamp
   * @params {number} timestamp
   * @params {number} insertPosition - insert to the left or right of the equal element.
   * @returns {number} index of insert position
   */
  _indexOf(timestamp, insertPosition = LEFT) {
    const {timeslices} = this;
    return findInsertPos(timeslices, timestamp, insertPosition);
  }
}
