/**
 * Convert stream messages for safe transfer between threads
 */
import {LOG_STREAM_MESSAGE} from '../constants';
import {getXvizConfig} from '../config/xviz-config';
import XvizObject from '../objects/xviz-object';

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
  const {OBJECT_STREAM} = getXvizConfig();

  const {type} = message;
  const streams = message.streams;
  if (type === LOG_STREAM_MESSAGE.TIMESLICE) {
    // Populate global object metadata
    // ParseXvizV1 did the same thing on the thread that it's run
    const objects = streams[OBJECT_STREAM];
    if (objects) {
      objects.features.forEach(f => {
        XvizObject.observe(f.id, message.timestamp);
      });
    }
  }
  return message;
}
