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

import {getXVIZConfig, setXVIZConfig} from '../config/xviz-config';
import {parseVersionString} from './xviz-v2-common';

// Post-processes log metadata
export function parseLogMetadata(data) {
  const {supportedVersions} = getXVIZConfig();
  const {version: versionString} = data;

  let currentMajorVersion = null;
  if (versionString === undefined) {
    currentMajorVersion = 1;
  } else {
    const {major} = parseVersionString(versionString);
    currentMajorVersion = major;
  }

  if (!currentMajorVersion) {
    throw new Error('Unable to detect the XVIZ version.');
  } else {
    setXVIZConfig({currentMajorVersion});
  }

  if (supportedVersions && !supportedVersions.includes(currentMajorVersion)) {
    throw new Error(
      `XVIZ version ${currentMajorVersion} is not supported.  Currently supported versions are ${supportedVersions}.`
    );
  }

  return currentMajorVersion === 1 ? parseLogMetadataV1(data) : parseLogMetadataV2(data);
}

export function parseLogMetadataV1(data) {
  // streams is the map from stream names (ie streams) to the url resource
  const originalStreams = data.streams || [];

  // Use XVIZ configuration to filter out unwanted / blacklisted streams
  const {STREAM_BLACKLIST} = getXVIZConfig();
  const streams = {};
  Object.keys(originalStreams).forEach(streamName => {
    if (!STREAM_BLACKLIST.has(streamName)) {
      streams[streamName] = originalStreams[streamName];
    }
  });

  const {logStartTime, logEndTime, eventStartTime, eventEndTime} = getTimestamps(data);

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
  const originalStreams = data.streams;

  // Use XVIZ configuration to filter out unwanted / blacklisted streams
  const {STREAM_BLACKLIST} = getXVIZConfig();
  const streams = {};
  if (originalStreams) {
    Object.keys(originalStreams).forEach(streamName => {
      if (!STREAM_BLACKLIST.has(streamName)) {
        streams[streamName] = originalStreams[streamName];
      }
    });
  }

  const logInfo = data.log_info || {};
  const {logStartTime, logEndTime, eventStartTime, eventEndTime} = getTimestamps(logInfo);
  const styles = collectStreamStyles(streams);

  const metadata = {
    ...data,

    streams, // Overrides entry from 'data'

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

function getTimestamps(info) {
  const logStartTime = Number.isFinite(info.log_start_time) ? info.log_start_time : null;
  const logEndTime = Number.isFinite(info.log_end_time) ? info.log_end_time : null;
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = Number.isFinite(info.start_time) ? info.start_time : logStartTime;
  const eventEndTime = Number.isFinite(info.end_time) ? info.end_time : logEndTime;

  return {logStartTime, logEndTime, eventStartTime, eventEndTime};
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
