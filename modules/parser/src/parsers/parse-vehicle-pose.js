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

import {_Pose as Pose} from 'math.gl';
import {addMetersToLngLat} from 'viewport-mercator-project';

function noop() {}

/**
 * Post-processes vehicle pose
 * covered by the trip in this log.
 * @param {Object} vehiclePose
 */
export function parseVehiclePose(vehiclePose, opts = {}) {
  // Callbacks to enable instrumentation
  const {onData = noop, onDone = noop, postProcessVehiclePose} = opts;
  const context = onData(opts) || opts.context;

  if (postProcessVehiclePose) {
    vehiclePose = vehiclePose
      .map(postProcessVehiclePose)
      // Remove invalid poses.
      .filter(Boolean);
  }

  onDone({...opts, context});

  return vehiclePose;
}

export function getTransformsFromPose(vehiclePose) {
  const {longitude, latitude, altitude = 0} = vehiclePose;

  const origin =
    Number.isFinite(vehiclePose.longitude) && Number.isFinite(vehiclePose.latitude)
      ? [longitude, latitude, altitude]
      : null;
  const pose = new Pose(vehiclePose);

  const vehicleRelativeTransform = pose.getTransformationMatrix();

  // If map_origin is not specified, use a faux position of [0, 0, 0]
  // deck.gl needs a lon/lat position to target the camera
  const trackPosition = addMetersToLngLat(
    origin || [0, 0, 0],
    vehicleRelativeTransform.transformVector([0, 0, 0])
  );

  return {
    origin,
    vehicleRelativeTransform,
    trackPosition,
    heading: (pose.yaw / Math.PI) * 180
  };
}
