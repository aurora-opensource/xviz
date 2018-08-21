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

import {getXvizConfig} from '../config/xviz-config';
import {get} from 'dotty';

// Post-processes log metadata
export function parseLogMetadata(data) {
  // streams is the map from stream names (ie streams) to the url resource
  const originalStreams = get(data, 'streams') || get(data, 'channels') || [];

  // Use XVIZ configuration to filter out unwanted / blacklisted streams
  const {filterStream} = getXvizConfig();
  const streams = {};
  Object.keys(originalStreams).forEach(streamName => {
    if (filterStream(streamName)) {
      streams[streamName] = originalStreams[streamName];
    }
  });

  const logStartTime = get(data, 'log_start_time');
  const logEndTime = get(data, 'log_end_time');
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = get(data, 'start_time') || logStartTime;
  const eventEndTime = get(data, 'end_time') || logEndTime;

  const metadata = {
    ...data,

    streams,

    logStartTime,
    logEndTime,

    eventStartTime,
    eventEndTime
  };

  return getXvizConfig().postProcessMetadata(metadata, data) || metadata;
}
