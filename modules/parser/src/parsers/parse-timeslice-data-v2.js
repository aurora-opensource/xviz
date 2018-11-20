// Extracts a TIMESLICE message v2
import {LOG_STREAM_MESSAGE} from '../constants';
import {getXVIZConfig} from '../config/xviz-config';
import {parseXVIZPose} from './parse-xviz-pose';
import {
  parseStreamFutures,
  parseStreamPrimitive,
  parseStreamVariable,
  parseStreamTimeSeries,
  parseStreamUIPrimitives
} from './parse-xviz-stream';

/* eslint-disable camelcase */

export default function parseStreamSet(data, convertPrimitive) {
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

  const streamSets = updates;

  let timestamp = null;
  if (!timestamp && streamSets) {
    timestamp = streamSets.reduce((t, stateUpdate) => {
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

  if (streamSets) {
    const xvizStreams = parseStreamSets(streamSets, timestamp, convertPrimitive);
    Object.assign(newStreams, xvizStreams);
  }

  return result;
}

/* eslint-disable max-statements */
function parseStreamSets(streamSets, timestamp, convertPrimitive) {
  const {STREAM_BLACKLIST} = getXVIZConfig();

  const newStreams = {};
  const poses = {};
  const primitives = {};
  const variables = {};
  const timeSeries = [];
  const futures = {};
  const uiPrimitives = {};

  for (const streamSet of streamSets) {
    Object.assign(poses, streamSet.poses);
    Object.assign(primitives, streamSet.primitives);
    Object.assign(variables, streamSet.variables);
    Object.assign(futures, streamSet.future_instances);
    Object.assign(uiPrimitives, streamSet.ui_primitives);

    if (streamSet.time_series) {
      if (timeSeries) {
        timeSeries.push(...streamSet.time_series);
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
