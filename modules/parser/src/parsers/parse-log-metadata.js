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
  const {version} = getXvizConfig();
  return version === 1 ? parseLogMetadataV1(data) : parseLogMetadataV2(data);
}

export function parseLogMetadataV1(data) {
  // streams is the map from stream names (ie streams) to the url resource
  const originalStreams = get(data, 'streams') || [];

  // Use XVIZ configuration to filter out unwanted / blacklisted streams
  const {STREAM_BLACKLIST} = getXvizConfig();
  const streams = {};
  Object.keys(originalStreams).forEach(streamName => {
    if (!STREAM_BLACKLIST.has(streamName)) {
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

  return metadata;
}

export function parseLogMetadataV2(data) {
  // streams is the map from stream names (ie streams) to the url resource
  const originalStreams = get(data, 'streams');

  // Use XVIZ configuration to filter out unwanted / blacklisted streams
  const {STREAM_BLACKLIST} = getXvizConfig();
  const streams = {};
  Object.keys(originalStreams).forEach(streamName => {
    if (!STREAM_BLACKLIST.has(streamName)) {
      streams[streamName] = originalStreams[streamName];
    }
  });

  const logStartTime = get(data, 'log_info.log_start_time');
  const logEndTime = get(data, 'log_info.log_end_time');
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = get(data, 'log_info.start_time') || logStartTime;
  const eventEndTime = get(data, 'log_info.end_time') || logEndTime;

  const styles = collectStreamStyles(streams);

  const metadata = {
    ...data,

    streams,

    logStartTime,
    logEndTime,

    start_time: eventStartTime, // eslint-disable-line camelcase
    end_time: eventEndTime, // eslint-disable-line camelcase

    // TODO: i don't think these are ever used
    eventStartTime,
    eventEndTime,

    styles
  };

  return metadata;
}

/**
 * Convert V2 stylesheet data to the internal representation
 */
function collectStreamStyles(metadataStreams) {
  const internalStylesheet = {};
  Object.keys(metadataStreams).forEach(streamId => {
    const streamMetadata = metadataStreams[streamId];
    const streamStylesheet = [];
    if (streamMetadata.stream_style) {
      streamStylesheet.push({
        name: '*',
        style: streamMetadata.stream_style
      });
    }

    if (streamMetadata.style_classes) {
      streamStylesheet.push(...streamMetadata.style_classes);
    }

    if (streamStylesheet.length !== 0) {
      internalStylesheet[streamId] = streamStylesheet;
    }
  });

  return internalStylesheet;
}
