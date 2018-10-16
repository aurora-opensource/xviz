// TODO/OSS - break this dependency
import {STREAM_DATA_CONTENT} from '../constants';
import XvizObject from '../objects/xviz-object';
import assert from '../utils/assert';

// Insert positions
const LEFT = 0;
const RIGHT = 1;

export default class XvizStreamBuffer {
  /**
   * constructor
   * @param {object} options
   * @param {number} options.startOffset - desired start of buffer to keep in memory
   *  relative to the current time.
   * @param {number} options.endOffset - desired end of buffer to keep in memory
   *  relative to the current time.
   */
  constructor({startOffset = null, endOffset = null, maxLength = null} = {}) {
    this.isOffsetLimited = Number.isFinite(startOffset) && Number.isFinite(endOffset);

    if (this.isOffsetLimited) {
      assert(startOffset <= 0 && endOffset >= 0, 'Steam buffer offset');
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
    /* Sorted stream slices */
    this.streams = {};
    this.videos = {};
    /* Update counter */
    this.lastUpdate = 0;

    this.hasBuffer = this.hasBuffer.bind(this);
  }

  /**
   * @property {number} the count of timeslices in buffer
   */
  get size() {
    return this.timeslices.length;
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
    if (!maxLength) {
      // If we have no limits on buffer size, just use the new provided values
      this.bufferStart = start;
      this.bufferEnd = end;
    } else if (
      !this.isFixedLimited ||
      !bufferStart ||
      !bufferEnd ||
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
    this.isFixedLimited = true;
    assert(
      !(this.isOffsetLimited && this.isFixedLimited),
      'updateFixedBuffer multiple buffer types'
    );
    this._pruneBuffer();
    return {start: this.bufferStart, end: this.bufferEnd, oldStart: bufferStart, oldEnd: bufferEnd};
  }

  /**
   * Gets the time range that the buffer is accepting data for
   * @returns {object} - {start | null, end | null} timestamps if any timeslice is loaded
   */
  getBufferRange() {
    if (this.isOffsetLimited || this.isFixedLimited) {
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
    const {timeslices} = this;
    const len = timeslices.length;

    let start = Infinity;
    let end = -Infinity;

    // Find the first frame with complete content
    for (let i = 0, missingContentFlags = STREAM_DATA_CONTENT.ALL; i < len; i++) {
      const timeslice = timeslices[i];
      missingContentFlags &= timeslice.missingContentFlags;

      if (!missingContentFlags) {
        start = timeslice.timestamp;
        break;
      }
    }

    // Find the last frame with complete content
    // Always favor timestamp on the vehicle pose
    let lastTimesliceWithVehicleData = null;
    for (let i = len - 1, missingContentFlags = STREAM_DATA_CONTENT.ALL; i >= 0; i--) {
      const timeslice = timeslices[i];
      missingContentFlags &= timeslice.missingContentFlags;
      if (!(timeslice.missingContentFlags & STREAM_DATA_CONTENT.VEHICLE)) {
        lastTimesliceWithVehicleData = timeslice;
      }

      if (!missingContentFlags) {
        end = lastTimesliceWithVehicleData.timestamp;
        break;
      }
    }

    if (start <= end) {
      // Both are found
      return {start, end};
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
    const {timeslices} = this;
    const startIndex = Number.isFinite(start) ? this._indexOf(start, LEFT) : 0;
    const endIndex = Number.isFinite(end) ? this._indexOf(end, RIGHT) : timeslices.length;
    return timeslices.slice(startIndex, endIndex);
  }

  /**
   * Gets loaded stream slices within the current buffer
   */
  getStreams() {
    return {...this.streams};
  }

  /**
   * Gets loaded video frames within the current buffer
   */
  getVideos() {
    return {...this.videos};
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
  insert(timeslice) {
    // backwards compatibility - normalize time slice
    timeslice.streams = timeslice.streams || {};

    const {timeslices} = this;
    const {timestamp} = timeslice;

    if (!this.isInBufferRange(timestamp)) {
      return false;
    }

    const insertPosition = this._indexOf(timestamp, LEFT);
    const timesliceAtInsertPosition = timeslices[insertPosition];

    if (timesliceAtInsertPosition && timesliceAtInsertPosition.timestamp === timestamp) {
      // Same timestamp, needs a merge
      timeslices[insertPosition] = {
        ...timesliceAtInsertPosition,
        ...timeslice,
        streams: {
          ...timesliceAtInsertPosition.streams,
          ...timeslice.streams
        },
        videos: {
          ...timesliceAtInsertPosition.videos,
          ...timeslice.videos
        },
        missingContentFlags:
          timesliceAtInsertPosition.missingContentFlags & timeslice.missingContentFlags
      };
    } else {
      timeslices.splice(insertPosition, 0, timeslice);
    }

    for (const streamName in timeslice.streams) {
      this.streams[streamName] = timeslices
        .map(timeSlice => timeSlice.streams[streamName])
        .filter(Boolean);
    }

    for (const streamName in timeslice.videos) {
      this.videos[streamName] = timeslices
        .map(timeSlice => timeSlice.videos && timeSlice.videos[streamName])
        .filter(Boolean);
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
    if (this.isOffsetLimited) {
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
   * This is used to trigger a selector update without creating a new XvizStreamBuffer instance
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
    const {bufferStart, bufferEnd, isOffsetLimited, isFixedLimited} = this;
    if ((isOffsetLimited || isFixedLimited) && Number.isFinite(bufferStart)) {
      return timestamp >= bufferStart && timestamp <= bufferEnd;
    }
    return true;
  }

  _pruneBuffer() {
    const {timeslices} = this;

    if (timeslices.length) {
      const startIndex = this._indexOf(this.bufferStart, LEFT);
      const endIndex = this._indexOf(this.bufferEnd, RIGHT);

      XvizObject.prune(this.bufferStart, this.bufferEnd);

      if (startIndex > 0 || endIndex < timeslices.length) {
        // Drop frames that are outside of the buffer
        timeslices.splice(endIndex);
        timeslices.splice(0, startIndex);

        this.lastUpdate++;
      }
    }
  }

  /**
   * Binary search on sorted timeslices
   * @params {number} timestamp
   * @params {number} insertPosition - insert to the left or right of the equal element.
   * @returns {number} index of insert position
   */
  _indexOf(timestamp, insertPosition = LEFT) {
    assert(Number.isFinite(timestamp), 'streambuffer timestamp');

    const {timeslices} = this;

    let lowerBound = 0;
    let upperBound = timeslices.length - 1;
    let currentIndex;
    let currentTimestamp;

    while (lowerBound <= upperBound) {
      currentIndex = ((lowerBound + upperBound) / 2) | 0;
      currentTimestamp = timeslices[currentIndex].timestamp;

      if (currentTimestamp < timestamp) {
        lowerBound = currentIndex + 1;
      } else if (currentTimestamp > timestamp) {
        upperBound = currentIndex - 1;
      } else {
        return insertPosition === LEFT ? currentIndex : currentIndex + 1;
      }
    }

    return lowerBound;
  }
}
