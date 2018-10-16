import BaseSynchronizer from './base-synchronizer';

export default class StreamSynchronizer extends BaseSynchronizer {
  /**
   * @classdesc
   * Lets the application do synchronized walks through a set of time slices
   * and allows the app to get the data object closes to a given time.
   *
   * @class
   * @param Number startTime - The starting GPS time
   * @param {XvizStreamBuffer} streamBuffer - The stream buffer
   * - Each timeslice object must contain a GPS timestamp
   */
  constructor(startTime, streamBuffer) {
    super(startTime);

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
    return slices.map(timeslice => timeslice.streams).filter(Boolean);
  }
}
