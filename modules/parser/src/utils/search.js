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
