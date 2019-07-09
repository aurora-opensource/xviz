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
  // Allow scenarios where there is no /vehicle_pose stream
  ALLOW_MISSING_PRIMARY_POSE: false,
  // Auto backfill missing stream metadata
  DYNAMIC_STREAM_METADATA: false,

  /* Deprecated configs, do not use */

  TIMESTAMP_FORMAT: 'seconds',
  PRIMARY_POSE_STREAM: '/vehicle_pose'
};

const xvizConfig = Object.assign({}, DEFAULT_XVIZ_CONFIG);

XVIZObject.setDefaultCollection(new XVIZObjectCollection());

// Allow subscribing to XVIZConfig changes
const subscribers = [];

// func is a function that takes no arguments
export function subscribeXVIZConfigChange(func) {
  subscribers.push(func);
}

function notifySubscribers() {
  subscribers.forEach(sub => sub());
}

// CONFIG contains the static configuration of XVIZ (streams, how to postprocess etc)
export function setXVIZConfig(config) {
  Object.assign(xvizConfig, config);

  if (Array.isArray(xvizConfig.STREAM_BLACKLIST)) {
    xvizConfig.STREAM_BLACKLIST = new Set(xvizConfig.STREAM_BLACKLIST);
  }

  notifySubscribers();
}

export function getXVIZConfig() {
  return xvizConfig;
}
