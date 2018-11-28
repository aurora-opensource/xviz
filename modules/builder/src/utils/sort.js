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
