import {getXVIZConfig, setXVIZSettings} from '../config/xviz-config';
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
    setXVIZSettings({currentMajorVersion});
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

  const logStartTime = data.log_start_time;
  const logEndTime = data.log_end_time;
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = data.start_time || logStartTime;
  const eventEndTime = data.end_time || logEndTime;

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
  const logStartTime = logInfo.log_start_time;
  const logEndTime = logInfo.log_end_time;
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = logInfo.start_time || logStartTime;
  const eventEndTime = logInfo.end_time || logEndTime;

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
