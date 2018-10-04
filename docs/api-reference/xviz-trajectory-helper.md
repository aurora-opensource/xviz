# XvizTrajectoryHelper 

Provide helper functions to generate trajectory for pose and objects.

## Functions

### getRelativeCoordinates(vertices : Array, basePose : Object) : Array
Given vertices and a base pose, transform the vertices to `basePose` relative coordinates
  * `vertices: Array`, array of [x, y, z]
  * `basePose: Object`, {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}

### getPoseTrajectory(input: object) : Array
Generate trajectory for list of poses with given start frame and end frame

* `input` object should contain the following properties
  * `poses: Array`, array of `Pose` entries
    * each pose should have `x, y, z, longitude, latitude, altitude, roll, pitch, yaw`
  * `startFrame: Number`, start frame number of trajectory
  * `endFrame: Number`, end frame number of trajectory

### getObjectTrajectory(input: object) : Array
Generate object trajectory in pose relative coordinates

* `input` object should contain the following properties
  * `targetObject: Object`, the `object` to generate trajectory
    * object should have `id, x, y, z`
  * `objectFrames: Array`, all the frames with objects
    * each object should have `id, x, y, z`
  * `poseFrames: Array`, all the frames with base poses
    * each pose should have `x, y, z, longitude, latitude, altitude, roll, pitch, yaw`
  * `startFrame: Number`, start frame number of trajectory
  * `endFrame: Number`, end frame number of trajectory
