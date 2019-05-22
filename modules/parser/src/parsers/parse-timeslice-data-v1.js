// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Extracts a TIMESLICE message v1
import {getXVIZConfig} from '../config/xviz-config';
import {XVIZ_MESSAGE_TYPE} from '../constants';
import {parseStreamFutures, parseStreamPrimitive, parseStreamVariable} from './parse-xviz-stream';

export default function parseTimesliceData(data, convertPrimitive) {
  const {PRIMARY_POSE_STREAM} = getXVIZConfig();
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
    return {type: XVIZ_MESSAGE_TYPE.INCOMPLETE};
  }

  const newStreams = {};
  const result = {
    ...otherInfo,
    type: XVIZ_MESSAGE_TYPE.TIMESLICE,
    streams: newStreams,
    timestamp
  };

  if (stateUpdates) {
    const xvizStreams = parseStateUpdates(stateUpdates, timestamp, convertPrimitive);
    Object.assign(newStreams, xvizStreams);
  }

  if (vehiclePose) {
    // v1 -> v2
    newStreams[PRIMARY_POSE_STREAM] = vehiclePose;
  }

  return result;
}

function parseStateUpdates(stateUpdates, timestamp, convertPrimitive) {
  const {STREAM_BLACKLIST} = getXVIZConfig();

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

  Object.keys(futures)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(future => {
      newStreams[future] = parseStreamFutures(futures[future], future, timestamp, convertPrimitive);
    });

  return newStreams;
}
