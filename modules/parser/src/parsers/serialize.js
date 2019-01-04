/**
 * Convert stream messages for safe transfer between threads
 */
import {LOG_STREAM_MESSAGE} from '../constants';
import {getXVIZConfig} from '../config/xviz-config';
import XVIZObject from '../objects/xviz-object';

/**
 * placeholder
 */
export function preSerialize(message) {
  return message;
}

// Populate global object metadata
// ParseXVIZPrimitive did the same thing on the thread that it's run
function observeObjects(objects, timestamp) {
  if (objects) {
    objects.features.forEach(f => {
      XVIZObject.observe(f.id, timestamp);
    });
  }
}

/**
 * Restore message after deserialization (received via postMessage)
 * @params message {object} - received dehydrated message from other threads
 */
export function postDeserialize(message) {
  if (message.type !== LOG_STREAM_MESSAGE.TIMESLICE) {
    return message;
  }

  const {OBJECT_STREAM} = getXVIZConfig();
  const {streams, timestamp} = message;

  // OBJECT_STREAM is deprecated, only keeping for backward compatibility
  if (OBJECT_STREAM) {
    observeObjects(streams[OBJECT_STREAM], timestamp);
    return message;
  }

  for (const streamName in streams) {
    const objects = streams[streamName];
    if (objects.features && objects.features.length && objects.features[0].id) {
      observeObjects(objects, timestamp);
    }
  }
  return message;
}
