/**
 * Insert time and value pair to the array and sort based on timestamp
 * @param timestamps list of sorted timestamps
 * @param values list of values sorted based on timestamps
 * @param ts
 * @param value
 */
export function insertTimestamp(timestamps, values, ts, value) {
  let insertIndex = timestamps.findIndex(x => x > ts);
  if (insertIndex === -1) {
    insertIndex = timestamps.length;
  }
  timestamps.splice(insertIndex, 0, ts);
  values.splice(insertIndex, 0, value);
}
