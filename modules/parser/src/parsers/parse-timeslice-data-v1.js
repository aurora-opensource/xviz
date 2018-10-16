// Extracts a TIMESLICE message v1
import {getXvizConfig, LOG_STREAM_MESSAGE, STREAM_DATA_CONTENT} from '..';
import {parseStreamFutures, parseStreamPrimitive, parseStreamVariable} from './parse-xviz-stream';

export default function parseTimesliceData(data, convertPrimitive) {
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
