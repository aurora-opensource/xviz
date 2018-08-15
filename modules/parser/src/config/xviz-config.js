const DEFAULT_XVIZ_CONFIG = {
  // Config
  DEFAULT_METADATA: {},

  PRIMARY_POSE_STREAM: 'vehicle-pose',
  OBJECT_STREAM: 'objects',

  NON_RENDERING_STREAMS: [],
  VIDEO_STREAM_PATTERNS: {IMAGE: /^$/, VIDEO: /^$/},

  filterStream: streamName => true, // Use to filter out unwanted streams
  getLabelNameFromStream: streamName => streamName, // Relabel streams
  filterPrimitive: primitive => true, // Filter out primitives before post processing,

  postProcessMetadata: metadata => metadata,
  postProcessVehiclePose: pose => pose, // Process vehicle pose from datum
  preProcessPrimitive: primitive => primitive, // Applied before normalize primitive
  postProcessFrame: frame => frame, // Post process log frame, used in LogSlice.getCurrentFrame
  postProcessTimeslice: timeslice => timeslice, // Post process timeslice

  getTransformsFromPose: pose => null, // transform matrices from vehicle pose,
  getTrackedObjectPosition: _ => null,

  observeObjects: () => {}
};

const DEFAULT_XVIZ_SETTINGS = {
  TIME_WINDOW: 0.4,
  hiTimeResolution: 1 / 10, // Update pose and lightweight geometry up to 60Hz
  loTimeResolution: 1 / 10, // Throttle expensive geometry updates to 10Hz
  pathDistanceThreshold: 0.1 // Filters out close vertices (work around for PathLayer issue)
};

let xvizConfig = null;
const xvizSettings = Object.assign({}, DEFAULT_XVIZ_SETTINGS);

// CONFIG contains the static configuration of XVIZ (streams, how to postprocess etc)
export function setXvizConfig(config) {
  xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG, config);
}

export function getXvizConfig(config) {
  if (!xvizConfig) {
    throw new Error('Need to set XVIZ config');
  }
  return xvizConfig;
}

// SETTINGS are dynamic settings that can be changed during runtime by apps
export function setXvizSettings(config) {
  // TODO/OSS - offer a way to subscribe to settings changes
  Object.assign(xvizSettings, config);
}

export function getXvizSettings(config) {
  return xvizSettings;
}
