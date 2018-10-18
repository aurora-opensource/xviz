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
