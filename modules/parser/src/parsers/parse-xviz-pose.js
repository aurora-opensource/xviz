export function parseXVIZPose(pose) {
  const {mapOrigin, position, orientation, timestamp} = pose;

  const result = {
    timestamp
  };

  if (mapOrigin) {
    const {longitude, latitude, altitude} = mapOrigin;
    Object.assign(result, {
      longitude,
      latitude,
      altitude
    });
  }

  if (position) {
    const [x, y, z] = position;
    Object.assign(result, {
      x,
      y,
      z
    });
  }

  if (orientation) {
    const [roll, pitch, yaw] = orientation;
    Object.assign(result, {
      roll,
      pitch,
      yaw
    });
  }

  return {...pose, ...result};
}
