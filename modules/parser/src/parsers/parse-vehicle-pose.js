import {getXvizConfig} from '../config/xviz-config';
import assert from '../utils/assert';

import {_Pose as Pose, Matrix4} from 'math.gl';
import {getDistanceScales, lngLatToWorld, worldToLngLat} from 'viewport-mercator-project';

function noop() {}

/**
 * Post-processes vehicle pose
 * covered by the trip in this log.
 * @param {Object} vehiclePose
 */
/* eslint-disable complexity, max-statements */
export function parseVehiclePose(vehiclePose, opts = {}) {
  const {postProcessVehiclePose} = getXvizConfig();

  // Callbacks to enable instrumentation
  const {onData = noop, onDone = noop} = opts;
  const context = onData(opts) || opts.context;

  const newVehiclePose = vehiclePose
    .map(postProcessVehiclePose)
    // Remove invalid poses.
    .filter(Boolean);

  onDone({...opts, context});

  return newVehiclePose;
}

// TODO - move to viewport-mercator-project
function addMetersToLngLat(lngLat, xyz) {
  const scale = 1; // doesn't really matter
  const {pixelsPerMeter, pixelsPerMeter2} = getDistanceScales({
    longitude: lngLat[0],
    latitude: lngLat[1],
    scale,
    highPrecision: true
  });
  const [x, y, z] = xyz;

  const worldspace = lngLatToWorld(lngLat, scale);
  worldspace[0] += x * (pixelsPerMeter[0] + pixelsPerMeter2[0] * y);
  worldspace[1] -= y * (pixelsPerMeter[1] + pixelsPerMeter2[1] * y);

  const newLngLat = worldToLngLat(worldspace, scale);
  return [newLngLat[0], newLngLat[1], lngLat[2] + z];
}

export function getTransformsFromPose(vehiclePose) {
  const {longitude, latitude, altitude = 0} = vehiclePose;

  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    // Default schema
    const origin = [longitude, latitude, altitude];
    const pose = new Pose(vehiclePose);
    const vehicleRelativeTransform = pose.getTransformationMatrix();

    const trackPosition = addMetersToLngLat(
      origin,
      vehicleRelativeTransform.transformVector([0, 0, 0])
    );

    return {
      origin: [longitude, latitude, altitude],
      vehicleRelativeTransform,
      trackPosition,
      heading: (pose.yaw / Math.PI) * 180
    };
  }

  return null;
}
