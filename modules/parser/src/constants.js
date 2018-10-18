/** @constant TIME_WINDOW
 * Determines the amount of time, in seconds, we will consider
 * before a given time.
 *
 * The system primarily operates at 100hz and 10hz. The 10hz gives
 * a window of 100ms between samples. We double that to ensure we
 * cover a sufficient time window for any available data.
 */
export const LOG_STREAM_MESSAGE = {
  METADATA: 'METADATA',
  TIMESLICE: 'TIMESLICE',
  DONE: 'DONE',
  VIDEO_METADATA: 'VIDEO_METADATA',
  VIDEO_FRAME: 'VIDEO_FRAME',
  ERROR: 'ERROR',
  INCOMPLETE: 'INCOMPLETE'
};
