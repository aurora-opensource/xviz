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
/* eslint-disable camelcase */
import {tfToPose} from '../common/transforms';

/* Transforms in ROS can be static or dynamic, and
 * there is no specification for the frame_id's just
 * conventions.
 *
 * The purpose of this class is to be repository of transforms
 * and provide an interface with dealing with them so we cann
 * evolve it as necessary.
 */

/*
const DEFAULT_TRANSFORM = {
  x: 0,
  y: 0,
  z: 0,
  pitch: 0,
  roll: 0,
  yaw: 0
};
*/

export const ROSTransformHandler = {
  get: (target, prop, receiver) => {
    let field;
    if (prop in target.transforms) {
      field = target.poseForTransformTo(prop);
    } else {
      field = Reflect.get(target, prop, receiver);
    }

    return field;
  }
};

export class ROSTransforms {
  constructor({staticTransforms} = {}) {
    // option
    //   default transform

    this.transforms = {};
    this.staticTransforms = staticTransforms;
  }

  // Add a transform directly support
  //  geometry_msg/Transform
  //  timestamp, from, to, Math.gl Pose
  //  timestamp, from, to, {x, y, z, pitch, roll, yaw}
  // addTransform(msg) {}

  // Add tf2_msg/TFMessage
  // { header,
  //   child_frame_id,
  //   transform
  // }
  addTransformMsg(msg) {
    const to = msg.child_frame_id;
    if (!this.transforms[to]) {
      this.transforms[to] = [];
    }

    this.transforms[to].push(msg);
  }

  // Return the transform where the parameter frameId matches the msg frame_child_id
  // Dynamic transforms take priority over static transforms
  // Returns the *most recent* entry
  poseForTransformTo(frameId) {
    if (this.transforms[frameId]) {
      const tforms = this.transforms[frameId];
      const tform = tforms[tforms.length - 1];
      return tfToPose(tform.transform);
    }

    if (this.staticTransforms) {
      return this.staticTransforms.poseForTransformTo(frameId);
    }

    return undefined;
  }

  // Return original Transform Message
  transformMsgTo(frameId) {
    if (this.transforms[frameId]) {
      const tforms = this.transforms[frameId];
      return tforms[tforms.length - 1];
    }

    if (this.staticTransforms) {
      return this.staticTransforms.transformMsgTo(frameId);
    }

    return undefined;
  }
}
