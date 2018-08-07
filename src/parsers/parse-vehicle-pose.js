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
