import XvizPrimitiveSettingsV1 from '../parsers/xviz-primitives-v1';
import XvizPrimitiveSettingsV2 from '../parsers/xviz-primitives-v2';

import XvizObjectCollection from '../objects/xviz-object-collection';
import XvizObject from '../objects/xviz-object';

const DEFAULT_XVIZ_CONFIG = {
  // Config
  version: 2,

  PRIMARY_POSE_STREAM: '/vehicle_pose',
  // TODO - support multiple?
  OBJECT_STREAM: 'objects',

  STREAM_BLACKLIST: new Set(),

  preProcessPrimitive: primitive => primitive // Applied before normalize primitive
};

const DEFAULT_XVIZ_SETTINGS = {
  TIME_WINDOW: 0.4,
  hiTimeResolution: 1 / 10, // Update pose and lightweight geometry up to 60Hz
  loTimeResolution: 1 / 10, // Throttle expensive geometry updates to 10Hz
  pathDistanceThreshold: 0.1 // Filters out close vertices (work around for PathLayer issue)
};

let xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG);
const xvizSettings = Object.assign({}, DEFAULT_XVIZ_SETTINGS);

XvizObject.setDefaultCollection(new XvizObjectCollection());

// CONFIG contains the static configuration of XVIZ (streams, how to postprocess etc)
export function setXvizConfig(config) {
  xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG, config);

  xvizConfig.PRIMITIVE_SETTINGS =
    xvizConfig.version === 1 ? XvizPrimitiveSettingsV1 : XvizPrimitiveSettingsV2;

  if (Array.isArray(xvizConfig.STREAM_BLACKLIST)) {
    xvizConfig.STREAM_BLACKLIST = new Set(xvizConfig.STREAM_BLACKLIST);
  }
}

export function getXvizConfig() {
  return xvizConfig;
}

// SETTINGS are dynamic settings that can be changed during runtime by apps
export function setXvizSettings(config) {
  // TODO/OSS - offer a way to subscribe to settings changes
  Object.assign(xvizSettings, config);
}

export function getXvizSettings() {
  return xvizSettings;
}
