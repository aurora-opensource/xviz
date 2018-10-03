const REGEX = /^\/[a-zA-Z0-9_.:/\-]+[^\/]$/;

/**
 * validate streamId
 *  - always starts with a /
 *  - sections contain only: [a-zA-Z0-9_-:.]
 *  - does not end with a /
 * @param streamId
 * @returns {boolean}
 */
export function validateStreamId(streamId) {
  return REGEX.test(streamId);
}
