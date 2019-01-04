import XVIZObjectCollection from '../objects/xviz-object-collection';
import XVIZObject from '../objects/xviz-object';

const DEFAULT_XVIZ_CONFIG = {
  // Supported major XVIZ versions
  supportedVersions: [1, 2],
  // Number set upon parsing metadata
  currentMajorVersion: 1,
  // Filters out close vertices (work around for PathLayer issue)
  pathDistanceThreshold: 0.1,

  /* User configs */

  // The time window to consider during synchronization
  TIME_WINDOW: 0.4,
  // The number of log frames to generate per second
  PLAYBACK_FRAME_RATE: 10,
  // The streams to block
  STREAM_BLACKLIST: new Set(),
  // Callback applied before normalize primitive
  preProcessPrimitive: primitive => primitive,

  /* Deprecated configs, do not use */

  TIMESTAMP_FORMAT: 'seconds',
  PRIMARY_POSE_STREAM: '/vehicle_pose'
};

const xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG);

XVIZObject.setDefaultCollection(new XVIZObjectCollection());

// CONFIG contains the static configuration of XVIZ (streams, how to postprocess etc)
export function setXVIZConfig(config) {
  Object.assign(xvizConfig, config);

  if (Array.isArray(xvizConfig.STREAM_BLACKLIST)) {
    xvizConfig.STREAM_BLACKLIST = new Set(xvizConfig.STREAM_BLACKLIST);
  }
}

export function getXVIZConfig() {
  return xvizConfig;
}
