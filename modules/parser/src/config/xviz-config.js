import XVIZPrimitiveSettingsV1 from '../parsers/xviz-primitives-v1';
import XVIZPrimitiveSettingsV2 from '../parsers/xviz-primitives-v2';

import XVIZObjectCollection from '../objects/xviz-object-collection';
import XVIZObject from '../objects/xviz-object';

const DEFAULT_XVIZ_CONFIG = {
  // Supported major XVIZ versions
  supportedVersions: [1, 2],

  PRIMARY_POSE_STREAM: '/vehicle_pose',
  // TODO - support multiple?
  OBJECT_STREAM: 'objects',

  STREAM_BLACKLIST: new Set(),

  preProcessPrimitive: primitive => primitive // Applied before normalize primitive
};

const DEFAULT_XVIZ_SETTINGS = {
  currentMajorVersion: 1, // Number set upon parsing metadata
  PRIMITIVE_SETTINGS: XVIZPrimitiveSettingsV1,

  TIME_WINDOW: 0.4,
  hiTimeResolution: 1 / 10, // Update pose and lightweight geometry up to 60Hz
  loTimeResolution: 1 / 10, // Throttle expensive geometry updates to 10Hz
  pathDistanceThreshold: 0.1 // Filters out close vertices (work around for PathLayer issue)
};

let xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG);
const xvizSettings = Object.assign({}, DEFAULT_XVIZ_SETTINGS);

XVIZObject.setDefaultCollection(new XVIZObjectCollection());

// CONFIG contains the static configuration of XVIZ (streams, how to postprocess etc)
export function setXVIZConfig(config) {
  xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG, config);

  if (Array.isArray(xvizConfig.STREAM_BLACKLIST)) {
    xvizConfig.STREAM_BLACKLIST = new Set(xvizConfig.STREAM_BLACKLIST);
  }
}

export function getXVIZConfig() {
  return xvizConfig;
}

// SETTINGS are dynamic settings that can be changed during runtime by apps
export function setXVIZSettings(config) {
  // TODO/OSS - offer a way to subscribe to settings changes
  Object.assign(xvizSettings, config);

  xvizSettings.PRIMITIVE_SETTINGS =
    xvizSettings.currentMajorVersion === 1 ? XVIZPrimitiveSettingsV1 : XVIZPrimitiveSettingsV2;
}

export function getXVIZSettings() {
  return xvizSettings;
}
