import {getXvizConfig} from '../config/xviz-config';
import {get} from 'dotty';

// Converts the XVIZ Video/Image identifiers into
// nice names.
// For example: /hdcam/12_middle_front_roof_wide/image => "Middle Front Roof Wide"
export function getVideoNiceName(name) {
  return name
    .split('_')
    .map(word => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

// Parse video identifiers based on the type "image" or "video"
// Returns an object keyed by clean names to the identifier
export function parseMediaStreamName(mediaList, matcherType) {
  const {VIDEO_STREAM_PATTERNS} = getXvizConfig();

  const videosByName = {};

  const matcher = {
    image: VIDEO_STREAM_PATTERNS.IMAGE,
    video: VIDEO_STREAM_PATTERNS.VIDEO
  };

  mediaList.forEach(identifier => {
    const name = identifier.match(matcher[matcherType]);
    if (name) {
      const cameraName = getVideoNiceName(name[1]);
      videosByName[cameraName] = identifier;
    }
  });

  return videosByName;
}

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

  // TODO(tim): videos should be treated the same way.  Stream != resource
  let videos = get(data, 'videos');
  videos = videos ? Object.values(videos) : [];

  // Video files produced by ETL
  let videosByName = parseMediaStreamName(videos, 'video');
  if (Object.keys(videosByName).length === 0) {
    // Streaming video source names
    videosByName = parseMediaStreamName(get(data, 'image_channels') || [], 'image');
  }

  const logStartTime = get(data, 'log_start_time');
  const logEndTime = get(data, 'log_end_time');
  // Fallback to complete log time if we don't have a specific playback time range
  const eventStartTime = get(data, 'start_time') || logStartTime;
  const eventEndTime = get(data, 'end_time') || logEndTime;

  const metadata = {
    ...data,

    streams,
    videos,
    videosByName,

    logStartTime,
    logEndTime,

    eventStartTime,
    eventEndTime
  };

  return getXvizConfig().postProcessMetadata(metadata, data) || metadata;
}
