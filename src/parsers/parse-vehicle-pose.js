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

function noop() {}

/**
 * Post-processes vehicle pose
 * covered by the trip in this log.
 * @param {Object} vehiclePose
 */
/* eslint-disable complexity, max-statements */
export function parseVehiclePose(vehiclePose, opts = {}) {
  // Callbacks to enable instrumentation
  const {onData = noop, onDone = noop} = opts;
  const context = onData(opts) || opts.context;

  const startTime = get(vehiclePose[0], 'time');

  const newVehiclePose = vehiclePose
    // Post process each pose
    .map(datum => parseVehiclePoseDatum(datum, startTime))
    // Remove invalid poses.
    .filter(Boolean);

  onDone({...opts, context});

  return newVehiclePose;
}

export function parseVehiclePoseDatum(datum, startTime) {
  // TODO consolidate the name for time/timestamp
  const time = get(datum, 'time');
  const {postProcessVehiclePose} = getXvizConfig();
  // TODO - this is not a proper postprocess...
  const vehiclePose = postProcessVehiclePose(datum);
  return vehiclePose ? {time, ...vehiclePose} : null;
}
