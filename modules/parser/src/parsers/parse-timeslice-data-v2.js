// Extracts a TIMESLICE message v2
import {LOG_STREAM_MESSAGE, STREAM_DATA_CONTENT} from '../constants';
import {getXvizConfig} from '../config/xviz-config';
import {parseXVIZPose} from './parse-xviz-pose';
import {parseStreamFutures, parseStreamPrimitive, parseStreamVariable} from './parse-xviz-stream';

export default function parseTimesliceData(data, convertPrimitive) {
  const {PRIMARY_POSE_STREAM, postProcessTimeslice, postProcessVehiclePose} = getXvizConfig();
  const {state_updates: stateUpdates, ...otherInfo} = data;

  let timestamp;
  if (stateUpdates) {
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
    // TODO/Xintong validate primary vehicle pose in each update?
    missingContentFlags: !stateUpdates && STREAM_DATA_CONTENT.XVIZ
  };

  if (stateUpdates) {
    const xvizStreams = parseStateUpdates(stateUpdates, timestamp, convertPrimitive);
    Object.assign(newStreams, xvizStreams);
  }

  if (newStreams[PRIMARY_POSE_STREAM]) {
    result.vehiclePose = postProcessVehiclePose(newStreams[PRIMARY_POSE_STREAM]);
    newStreams[PRIMARY_POSE_STREAM] = result.vehiclePose;
  }

  return postProcessTimeslice ? postProcessTimeslice(result) : result;
}

function parseStateUpdates(stateUpdates, timestamp, convertPrimitive) {
  const {filterStream} = getXvizConfig();

  const newStreams = {};
  const poses = {};
  const primitives = {};
  const variables = {};
  const futures = {};

  for (const stateUpdate of stateUpdates) {
    Object.assign(poses, stateUpdate.poses);
    Object.assign(primitives, stateUpdate.primitives);
    Object.assign(variables, stateUpdate.variables);
    Object.assign(futures, stateUpdate.futures);
  }

  Object.keys(poses)
    .filter(streamName => filterStream(streamName))
    .forEach(streamName => {
      newStreams[streamName] = parseXVIZPose(poses[streamName]);
    });

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
