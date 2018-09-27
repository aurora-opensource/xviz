# XvizTrajectoryHelper 

Provide helper functions to generate trajectory for pose and objects.

## Functions

### getRelativeCoordinates(vertices : Array, basePose : Object) : Array
Given vertices and a base pose, transform the vertices to `basePose` relative coordinates
  * `vertices`, array of [x, y, z]
  * `basePose`, {x, y, z, roll, pitch, yaw}

### getPoseTrajectory
Generate trajectory for list of poses with given start frame and end frame

### getObjectTrajectory(input: object) : Array
Get object trajectory in pose relative coordinates
* `input` object should contain the following properties
   * `targetObject`, the `object` of the generated trajectory
   * `objectFrames`, all the frames of objects
   * `poseFrames`, all the frames of base poses
   * `startFrame`, start frame of trajectory
   * `endFrame`, end frame of trajectory
