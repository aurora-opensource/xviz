// Extracts a TIMESLICE message v2
import {LOG_STREAM_MESSAGE} from '../constants';
import {getXvizConfig} from '../config/xviz-config';
import {parseXVIZPose} from './parse-xviz-pose';
import {
  parseStreamFutures,
  parseStreamPrimitive,
  parseStreamVariable,
  parseStreamTimeSeries,
  parseStreamUIPrimitives
} from './parse-xviz-stream';

/* eslint-disable camelcase */

export default function parseTimesliceData(data, convertPrimitive) {
  const {update_type, updates} = data;

  if (update_type !== 'snapshot') {
    throw new Error(
      `Only XVIZ update_type of "snapshot" is currently supported. Type "${update_type}" is not supported.`
    );
  }

  if (!updates) {
    return {type: LOG_STREAM_MESSAGE.INCOMPLETE, message: 'Missing required "updates" property'};
  }

  if (updates && updates.length === 0) {
    return {
      type: LOG_STREAM_MESSAGE.INCOMPLETE,
      message: 'Property "updates" has length of 0, no data?'
    };
  }

  if (updates.length > 1) {
    throw new Error(
      `Only XVIZ first update of "snapshot" is currently supported. Current updates has "${
        updates.length
      }" entries.`
    );
  }

  const stateUpdates = updates;

  let timestamp = null;
  if (!timestamp && stateUpdates) {
    timestamp = stateUpdates.reduce((t, stateUpdate) => {
      return Math.max(t, stateUpdate.timestamp);
    }, 0);
  }

  if (!timestamp) {
    // Incomplete stream message, just tag it accordingly so client can ignore it
    return {type: LOG_STREAM_MESSAGE.INCOMPLETE, message: 'Missing timestamp in "updates"'};
  }

  const newStreams = {};
  const result = {
    type: LOG_STREAM_MESSAGE.TIMESLICE,
    streams: newStreams,
    timestamp
    // TODO/Xintong validate primary vehicle pose in each update?
  };

  if (stateUpdates) {
    const xvizStreams = parseStateUpdates(stateUpdates, timestamp, convertPrimitive);
    Object.assign(newStreams, xvizStreams);
  }

  return result;
}

/* eslint-disable max-statements */
function parseStateUpdates(stateUpdates, timestamp, convertPrimitive) {
  const {STREAM_BLACKLIST} = getXvizConfig();

  const newStreams = {};
  const poses = {};
  const primitives = {};
  const variables = {};
  const timeSeries = [];
  const futures = {};
  const uiPrimitives = {};

  for (const stateUpdate of stateUpdates) {
    Object.assign(poses, stateUpdate.poses);
    Object.assign(primitives, stateUpdate.primitives);
    Object.assign(variables, stateUpdate.variables);
    Object.assign(futures, stateUpdate.future_instances);
    Object.assign(uiPrimitives, stateUpdate.ui_primitives);

    if (stateUpdate.time_series) {
      if (timeSeries) {
        timeSeries.push(...stateUpdate.time_series);
      }
    }
  }

  Object.keys(poses)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(streamName => {
      newStreams[streamName] = parseXVIZPose(poses[streamName]);
    });

  Object.keys(primitives)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(primitive => {
      newStreams[primitive] = parseStreamPrimitive(
        primitives[primitive],
        primitive,
        timestamp,
        convertPrimitive
      );
    });

  Object.keys(variables)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(variable => {
      newStreams[variable] = parseStreamVariable(variables[variable], variable, timestamp);
    });

  if (timeSeries.length) {
    const timeSeriesStreams = parseStreamTimeSeries(timeSeries, STREAM_BLACKLIST);
    Object.assign(newStreams, timeSeriesStreams);
  }

  Object.keys(futures)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(future => {
      newStreams[future] = parseStreamFutures(futures[future], future, timestamp, convertPrimitive);
    });

  Object.keys(uiPrimitives)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(primitive => {
      newStreams[primitive] = parseStreamUIPrimitives(
        uiPrimitives[primitive],
        primitive,
        timestamp
      );
    });

  return newStreams;
}
/* eslint-enable max-statements */
