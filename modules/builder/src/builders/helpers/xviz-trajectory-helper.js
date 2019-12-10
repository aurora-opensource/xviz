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
  return vertices.map(p => transformMatrix.transform(p));
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
  const positions = [];
  const iterationLimit = Math.min(endFrame, poses.length);

  for (let i = startFrame; i < iterationLimit; i++) {
    positions.push(poses[i].pose);
  }

  const startPose = poses[startFrame].pose;
  const worldToStartPoseTransformMatrix = new Pose(startPose).getTransformationMatrix().invert();

  return positions.map(currPose => {
    // offset vector in world coordinate system
    const offset = getGeospatialVector(startPose, currPose);

    // transform offset to startPose coordinate system
    const relativeOffset = worldToStartPoseTransformMatrix.transform(offset);

    return relativeOffset;
  });
}

/**
 * Return transform matrix that can be used to transform
 * data in `from` pose coordinate system into the `to` pose coordinate system
 *
 * @param from {Object} {longitude, latitude, pitch, roll, yaw}
 * @param to {Object} {longitude, latitude, pitch, roll, yaw}
 * @returns {Object} transformation matrix that converts 'from' relative coordinates into 'to' relative coordinates
 */
export function getGeospatialToPoseTransform(from, to) {
  // Since 'to' is the target, get the vector from 'to -> from'
  // and use that to set the position of 'from Pose'

  // offset in world coordinate system
  let offset = getGeospatialVector(from, to);

  const fromPose = new Pose({
    x: 0,
    y: 0,
    z: 0,
    pitch: from.pitch,
    roll: from.roll,
    yaw: from.yaw
  });

  // transform offset to `fromPose` coordinate
  // TODO figure out why this step is needed
  const worldToFromPoseTransformMatrix = fromPose.getTransformationMatrix().invert();
  offset = worldToFromPoseTransformMatrix.transform(offset);

  const toPose = new Pose({
    x: offset[0],
    y: offset[1],
    z: offset[2],
    pitch: to.pitch,
    roll: to.roll,
    yaw: to.yaw
  });

  // there is a bug in math.gl https://github.com/uber-web/math.gl/issues/33
  // pose.getTransformationMatrixFromPose and pose.getTransformationMatrixFromPose are flipped
  return fromPose.getTransformationMatrixFromPose(toPose);
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

    // matrix to convert data from currVehiclePose relative to startVehiclePose relative.
    const transformMatrix = getGeospatialToPoseTransform(currVehiclePose, startVehiclePose);

    // objects in curr frame are meters offset based on currVehiclePose
    // need to convert to the coordinate system of the startVehiclePose
    const p = transformMatrix.transform([step.x, step.y, step.z]);
    vertices.push(p);
  }

  return vertices;
}

/* eslint-disable complexity */
/**
 * Get the meter vector from Geospatial coordinates in world coordinate system
 *
 * @param from {Object} {longitude, latitude, altitude, x, y, z}
 * @param to {Object} {longitude, latitude, altitude, x, y, z}
 * @returns {Array} Vector [x, y, z] in meters
 */
export function getGeospatialVector(from, to) {
  from = {
    longitude: from.longitude || 0,
    latitude: from.latitude || 0,
    altitude: from.altitude || 0,
    x: from.x || 0,
    y: from.y || 0,
    z: from.z || 0,
    yaw: from.yaw || 0
  };

  to = {
    longitude: to.longitude || 0,
    latitude: to.latitude || 0,
    altitude: to.altitude || 0,
    x: to.x || 0,
    y: to.y || 0,
    z: to.z || 0,
    yaw: to.yaw || 0
  };

  const fromPoint = turf.destination(
    [from.longitude, from.latitude, from.altitude],
    Math.sqrt(from.x * from.x + from.y * from.y),
    Math.PI / 2 - from.yaw,
    {units: 'meters'}
  );

  const toPoint = turf.destination(
    [to.longitude, to.latitude, to.altitude],
    Math.sqrt(to.x * to.x + to.y * to.y),
    Math.PI / 2 - to.yaw,
    {units: 'meters'}
  );

  const distInMeters = turf.distance(fromPoint, toPoint, {units: 'meters'});

  // Bearing is degrees from north, positive is clockwise
  const bearing = turf.bearing(fromPoint, toPoint);
  const bearingInRadians = turf.degreesToRadians(bearing);

  const diffZ = to.altitude + to.z - from.altitude - from.z;

  return [
    distInMeters * Math.sin(bearingInRadians),
    distInMeters * Math.cos(bearingInRadians),
    diffZ
  ];
}
/* eslint-enable complexity */

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
