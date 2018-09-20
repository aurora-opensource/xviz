/**
 * This file contains parsers for XVIZ log stream protocol.
 * Naming conventions:
 * `message` refers to the raw message received via webSocket.onmessage
 * `data` refers to pre-processed data objects (blob, arraybuffer, JSON object)
 */
/* global Blob, Uint8Array, TextDecoder */
import {LOG_STREAM_MESSAGE, STREAM_DATA_CONTENT} from '../constants';
import {getXvizConfig} from '../config/xviz-config';
import {parseBinaryXVIZ, isBinaryXVIZ} from '../loaders/xviz-loader/xviz-binary-loader';
import {parseLogMetadata} from './parse-log-metadata';
import {parseStreamPrimitive, parseStreamVariable, parseStreamFutures} from './parse-xviz-stream';
import {parseStreamVideoMessage} from './parse-stream-video-message';

function isJSON(encodedString) {
  const firstChar = String.fromCharCode(encodedString[0]);
  const lastChar = String.fromCharCode(encodedString[encodedString.length - 1]);

  return (firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']');
}

// get JSON from binary
function decode(data, recursive) {
  if (!data) {
    // ignore
  } else if (isBinaryXVIZ(data)) {
    return parseBinaryXVIZ(data);
  } else if (data instanceof Uint8Array && isJSON(data)) {
    const jsonString = new TextDecoder('utf8').decode(data);
    return JSON.parse(jsonString);
  } else if (recursive && typeof data === 'object') {
    for (const key in data) {
      // Only peek one-level deep
      data[key] = decode(data[key], false);
    }
  }
  return data;
}

// Post processes a stream message to make it easy to use for JavaScript applications
export function parseStreamDataMessage(message, onResult, onError, opts) {
  // TODO(twojtasz): better message dispatching
  // here, not all arraybuffer may be image (packed point cloud)
  if (message instanceof Blob) {
    parseStreamVideoMessage(message, onResult, onError);
    return;
  }

  try {
    let data;
    if (typeof message === 'string') {
      data = JSON.parse(message);
    } else {
      data = decode(message, true);
    }
    const result = parseStreamLogData(data, opts);
    onResult(result);
  } catch (error) {
    onError(error);
  }
}

export function parseStreamLogData(data, opts = {}) {
  // TODO(twojtasz): this data.message is due an
  // uncoordinated change on the XVIZ server, temporary.
  switch (data.type || data.message) {
    case 'metadata':
      return {
        ...parseLogMetadata(data),
        // ensure application sees the metadata type set to the uppercase version
        type: LOG_STREAM_MESSAGE.METADATA
      };
    case 'error':
      return {...data, message: 'Stream server error', type: LOG_STREAM_MESSAGE.ERROR};
    case 'done':
      return {...data, type: LOG_STREAM_MESSAGE.DONE};
    default:
      //  TODO(twojtasz): XVIZ should be tagging this with a type
      return parseTimesliceData(data, opts.convertPrimitive);
  }
}

// Extracts a TIMESLICE message
function parseTimesliceData(data, convertPrimitive) {
  const {PRIMARY_POSE_STREAM, postProcessTimeslice, postProcessVehiclePose} = getXvizConfig();
  const {vehicle_pose: vehiclePose, state_updates: stateUpdates, ...otherInfo} = data;

  let timestamp;
  if (vehiclePose) {
    timestamp = vehiclePose.time;
  } else if (stateUpdates) {
    timestamp = stateUpdates.reduce((t, stateUpdate) => {
      return Math.max(t, stateUpdate.timestamp);
    }, 0);
  }

  if (!timestamp) {
    // Incomplete stream message, just tag it accordingly so client can ignore it
    return {type: LOG_STREAM_MESSAGE.INCOMPLETE};
  }

  const newStreams = {};
  const result = {
    ...otherInfo,
    type: LOG_STREAM_MESSAGE.TIMESLICE,
    streams: newStreams,
    channels: newStreams, // TODO -remove, backwards compatibility
    timestamp,
    missingContentFlags:
      (!stateUpdates && STREAM_DATA_CONTENT.XVIZ) | (!vehiclePose && STREAM_DATA_CONTENT.VEHICLE)
  };

  if (stateUpdates) {
    const xvizStreams = parseStateUpdates(stateUpdates, timestamp, convertPrimitive);
    Object.assign(newStreams, xvizStreams);
  }

  if (vehiclePose) {
    result.vehiclePose = postProcessVehiclePose(vehiclePose);
    newStreams[PRIMARY_POSE_STREAM] = result.vehiclePose;
  }

  return postProcessTimeslice ? postProcessTimeslice(result) : result;
}

function parseStateUpdates(stateUpdates, timestamp, convertPrimitive) {
  const {filterStream} = getXvizConfig();

  const newStreams = {};
  const primitives = {};
  const variables = {};
  const futures = {};

  for (const stateUpdate of stateUpdates) {
    Object.assign(primitives, stateUpdate.primitives);
    Object.assign(variables, stateUpdate.variables);
    Object.assign(futures, stateUpdate.futures);
  }

  Object.keys(primitives)
    .filter(streamName => filterStream(streamName))
    .forEach(primitive => {
      newStreams[primitive] = parseStreamPrimitive(
        primitives[primitive],
        primitive,
        timestamp,
        convertPrimitive
      );
    });

  Object.keys(variables)
    .filter(streamName => filterStream(streamName))
    .forEach(variable => {
      newStreams[variable] = parseStreamVariable(variables[variable], variable, timestamp);
    });

  Object.keys(futures)
    .filter(streamName => filterStream(streamName))
    .forEach(future => {
      newStreams[future] = parseStreamFutures(futures[future], future, timestamp, convertPrimitive);
    });

  return newStreams;
}
