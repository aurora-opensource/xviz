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

// Extracts a TIMESLICE message v2
import {XVIZ_MESSAGE_TYPE, STATE_UPDATE_TYPE} from '../constants';
import {getXVIZConfig} from '../config/xviz-config';
import {parseXVIZPose} from './parse-xviz-pose';
import {parseXVIZLink} from './parse-xviz-link';
import {
  parseStreamFutures,
  parseStreamPrimitive,
  parseStreamVariable,
  parseStreamTimeSeries,
  parseStreamUIPrimitives
} from './parse-xviz-stream';
import log from '../utils/log';

/* eslint-disable camelcase */

export default function parseStreamSet(data, convertPrimitive) {
  const {update_type, updates} = data;
  const updateType = STATE_UPDATE_TYPE[update_type.toUpperCase()];

  if (!updateType) {
    log.error(`update_type of "${update_type}" is not supported.`)();
    return {type: XVIZ_MESSAGE_TYPE.INCOMPLETE, message: 'Unsupported update type'};
  }

  if (!updates) {
    return {type: XVIZ_MESSAGE_TYPE.INCOMPLETE, message: 'Missing required "updates" property'};
  }

  if (updates && updates.length === 0) {
    return {
      type: XVIZ_MESSAGE_TYPE.INCOMPLETE,
      message: 'Property "updates" has length of 0, no data?'
    };
  }

  if (updates.length > 1) {
    log.warn(
      `Only XVIZ first update of "snapshot" is currently supported. Current updates has "${
        updates.length
      }" entries.`
    )();
  }

  const streamSets = updates;

  let timestamp = null;
  if (streamSets) {
    timestamp = streamSets.reduce((t, stateUpdate) => {
      if (!t) {
        return stateUpdate && stateUpdate.timestamp;
      }
      return Math.max(t, stateUpdate.timestamp);
    }, null);
  }

  if (!Number.isFinite(timestamp)) {
    // Incomplete stream message, just tag it accordingly so client can ignore it
    return {type: XVIZ_MESSAGE_TYPE.INCOMPLETE, message: 'Missing timestamp in "updates"'};
  }

  const result = {
    type: XVIZ_MESSAGE_TYPE.TIMESLICE,
    updateType,
    streams: {},
    links: {},
    timestamp
    // TODO/Xintong validate primary vehicle pose in each update?
  };

  if (streamSets) {
    const {streams, links} = parseStreamSets(streamSets, timestamp, convertPrimitive);
    Object.assign(result.streams, streams);
    Object.assign(result.links, links);
  }

  return result;
}

/* eslint-disable max-statements */
function parseStreamSets(streamSets, timestamp, convertPrimitive) {
  const {STREAM_BLACKLIST} = getXVIZConfig();

  const newStreams = {};
  const newLinks = {};

  const poses = {};
  const primitives = {};
  const variables = {};
  const timeSeries = [];
  const futures = {};
  const uiPrimitives = {};
  const noDataStreams = [];

  for (const streamSet of streamSets) {
    Object.assign(newLinks, streamSet.links);

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

    if (streamSet.no_data_streams) {
      noDataStreams.push(...streamSet.no_data_streams);
    }
  }

  Object.keys(newLinks)
    .filter(streamName => !STREAM_BLACKLIST.has(streamName))
    .forEach(streamName => {
      newLinks[streamName] = parseXVIZLink(newLinks[streamName]);
    });

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

  if (noDataStreams.length) {
    // Explicitly set to null and the stream buffer will do the right thing
    noDataStreams.forEach(stream => (newStreams[stream] = null));
  }

  return {
    streams: newStreams,
    links: newLinks
  };
}
/* eslint-enable max-statements */
