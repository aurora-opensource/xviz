# XVIZ Trajectory Helpers (experimental)

> Note: These utilities are experimental. They may be changed between minor releases.

Provide helper functions to generate trajectory for pose and objects.

## Functions

### getRelativeCoordinates(vertices : Array, basePose : Object) : Array

```js
import {_getRelativeCoordinates as getRelativeCoordinates} from '@xviz/builder';
```

Given vertices and a base pose, transform the vertices to `basePose` relative coordinates

- `vertices` (Array), array of [x, y, z]
- `basePose` (Object), {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}

### getPoseTrajectory(input: object) : Array

```js
import {_getPoseTrajectory as getPoseTrajectory} from '@xviz/builder';
```

Generate trajectory for list of poses with given start frame and end frame

- `input` object should contain the following properties
  - `poses` (Array), array of `Pose` entries
    - each pose should have `x, y, z, longitude, latitude, altitude, roll, pitch, yaw`
  - `startFrame` (Number), start frame number of trajectory
  - `endFrame` (Number), end frame number of trajectory

### getObjectTrajectory(input: object) : Array

```js
import {_getObjectTrajectory as getObjectTrajectory} from '@xviz/builder';
```

Generate object trajectory in pose relative coordinates

- `input` (Object) should contain the following properties
  - `targetObject` (Object), the `object` to generate trajectory
    - object should have `id, x, y, z`
  - `objectFrames` (Array:Object), all the frames with objects
    - each object should have `id, x, y, z`
  - `poseFrames` (Array:Object), all the frames with base poses
    - each pose should have `x, y, z, longitude, latitude, altitude, roll, pitch, yaw`
  - `startFrame` (Number), start frame number of trajectory
  - `endFrame` (Number), end frame number of trajectory
