import {_Pose as Pose} from 'math.gl';
import * as turf from '@turf/turf';

/**
 * Given vertices and a base pose, transform the vertices to `basePose` relative coordinates
 * @param vertices {Array} list of [x, y, z] or [x, y]
 * @param basePose {Object} {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}
 * @returns {Array} list of vertices in relative coordinates
 */
export function getRelativeCoordinates(vertices, basePose) {
  if (!(basePose instanceof Pose)) {
    basePose = new Pose(basePose);
  }

  const transformMatrix = basePose.getTransformationMatrix();
  return vertices.map(p => transformMatrix.transformVector(p));
}

/**
 * Generate trajectory for list of poses with given start frame and end frame
 * @param poses {Array}, frames of pose data,
 *   each frame contains a `pose` entry with {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}
 * @param startFrame {Number}, start frame of trajectory
 * @param endFrame {Number}, end frame of trajectory
 * @returns {Array} trajectory, list of vertices
 */
export function getPoseTrajectory({poses, startFrame, endFrame}) {
  const vertices = [];
  const iterationLimit = Math.min(endFrame, poses.length);

  for (let i = startFrame; i < iterationLimit; i++) {
    vertices.push(poses[i].pose);
  }

  return vertices.map((m, i) => getGeospatialVector(vertices[0], m, vertices[0].yaw));
}

/**
 * Return transform matrix that can be used to transform
 * data in futurePose into the currentPose reference frame
 *
 * @param from {Object} {longitude, latitude, pitch, roll, yaw}
 * @param to {Object} {longitude, latitude, pitch, roll, yaw}
 * @returns {Object} tranformation matrix that converts 'from' relative coordinates into 'to' relative coordinates
 */
export function getGeospatialToPoseTransform(from, to) {
  const toPose = new Pose({
    x: 0,
    y: 0,
    z: 0,
    pitch: to.pitch,
    roll: to.roll,
    yaw: to.yaw
  });

  // Since 'to' is the target, get the vector from 'to -> from'
  // and use that to set the position of 'from Pose'
  const v = getGeospatialVector(to, from, to.yaw);

  const fromPose = new Pose({
    x: v[0],
    y: v[1],
    z: 0,
    pitch: from.pitch,
    roll: from.roll,
    yaw: from.yaw
  });

  return toPose.getTransformationMatrixToPose(fromPose);
}

/**
 * Get object trajectory in pose relative coordinates
 * @param targetObject {Object} {id, x, y, z, ...}
 * @param objectFrames {Array}, all the frames of objects, (object: {id, x, y, z})
 * @param poseFrames {Array}, all the frames of base poses (pose: {longitude, latitude, altitude})
 * @param startFrame {Number}, start frame of trajectory
 * @param endFrame {Number}, end frame of trajectory
 * @returns {Array} trajectory, list of vertices
 */
export function getObjectTrajectory({
  targetObject,
  objectFrames,
  poseFrames,
  startFrame,
  endFrame
}) {
  const vertices = [];
  const startVehiclePose = poseFrames[startFrame].pose;
  const limit = Math.min(endFrame, targetObject.lastFrame);
  const motions = getObjectMotions(targetObject, objectFrames, startFrame, limit);

  for (let i = 0; i < motions.length; i++) {
    const step = motions[i];
    const currVehiclePose = poseFrames[startFrame + i].pose;

    const [x, y] = getGeospatialVector(startVehiclePose, currVehiclePose, startVehiclePose.yaw);

    const transformMatrix = new Pose(currVehiclePose).getTransformationMatrixFromPose(
      new Pose(startVehiclePose)
    );

    // objects in curr frame are meters offset based on current vehicle pose
    // need to convert to the coordinate system of the start vehicle pose
    const p = transformMatrix.transformVector([step.x, step.y, step.z]);
    vertices.push([p[0] + x, p[1] + y, p[2]]);
  }

  return vertices;
}

/**
 * Get the meter vector from geospatial coordinates relative to the given heading
 *
 * @param from {Object} {longitude, latitude}
 * @param to {Object} {longitude, latitude}
 * @param heading {Number} Radian measurement, 0 = east, positive is counter clockwise
 * @returns {Array} Vector [x, y] in meters
 */
export function getGeospatialVector(from, to, heading = 0) {
  const fromCoord = turf.point([from.longitude, from.latitude]);
  const toCoord = turf.point([to.longitude, to.latitude]);
  const distInMeters = turf.distance(fromCoord, toCoord, {units: 'meters'});

  // Bearing is degrees from north, positive is clockwise
  const bearing = turf.bearing(fromCoord, toCoord);

  // Get the bearing relative to heading
  const relativeBearing = turf.degreesToRadians(90 - bearing);
  const radianDiff = relativeBearing - heading;

  return [distInMeters * Math.cos(radianDiff), distInMeters * Math.sin(radianDiff)];
}

function getFrameObjects(frames, frameNumber) {
  if (frames instanceof Map) {
    return frames.get(frameNumber);
  }
  if (frames instanceof Array) {
    return frames[frameNumber];
  }
  return null;
}

/**
 * Generate motions for target object
 * @param targetObject {Object} {startFrame, endFrame, id, x, y, z,...}
 * @param objectFrames {Map | Array}, either a Map (key is frameNumber, value is list of objects) or an array of frames
 * @param startFrame {Number}
 * @param endFrame {Number}
 * @returns {Array} list of motions from given startFrame to endFrame
 */
function getObjectMotions(targetObject, objectFrames, startFrame, endFrame) {
  startFrame = Math.max(targetObject.firstFrame, startFrame);
  endFrame = Math.min(targetObject.lastFrame, endFrame);

  const motions = [];
  for (let i = startFrame; i < endFrame; i++) {
    const objects = getFrameObjects(objectFrames, i);
    const object = objects.find(obj => obj.id === targetObject.id);
    motions.push(object);
  }

  return motions;
}
