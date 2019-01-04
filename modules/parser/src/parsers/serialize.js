/**
 * Convert stream messages for safe transfer between threads
 */
import {LOG_STREAM_MESSAGE} from '../constants';
import XVIZObject from '../objects/xviz-object';

/**
 * placeholder
 */
export function preSerialize(message) {
  return message;
}

/**
 * Restore message after deserialization (received via postMessage)
 * @params message {object} - received dehydrated message from other threads
 */
export function postDeserialize(message) {
  const {type, streams, timestamp} = message;

  if (type === LOG_STREAM_MESSAGE.TIMESLICE) {
    // Populate global object metadata
    // ParseXVIZV1 did the same thing on the thread that it's run
    for (const streamName in streams) {
      const objects = streams[streamName];
      if (objects.features && objects.features[0] && objects.features[0].id) {
        objects.features.forEach(f => {
          XVIZObject.observe(f.id, timestamp);
        });
      }
    }
  }
  return message;
}
