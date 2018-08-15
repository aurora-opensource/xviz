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

import {filterVertices} from './filter-vertices';

/* eslint-disable */
const PRIMITIVE_PROCCESSOR = {
  text: {
    validate: _ => true
  },
  tree_table: {
    validate: _ => true
  },
  points3d: {
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  points2d: {
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0,
    normalize: primitive => {
      for (let i = 0; i < primitive.vertices.length; i++) {
        primitive.vertices[i][2] = 0;
      }
    }
  },
  point2d: {
    enableZOffSet: true,
    validate: (primitive, streamName, time) =>
      primitive.vertices && primitive.vertices.length === 1,
    normalize: primitive => {
      primitive.vertices = primitive.vertices[0];
    }
  },
  line2d: {
    enableZOffset: true,
    validate: (primitive, streamName, time) =>
      primitive.vertices &&
      primitive.vertices.length >= 2 &&
      streamName !== '/route_follower/kickout/object/velocity',
    normalize: primitive => {
      // Filter out identical vertices to make sure we don't get rendering artifacts
      // in the path layer
      // TODO - handle this directly in deck.gl PathLayer
      primitive.vertices = filterVertices(primitive.vertices);
    }
  },
  polygon2d: {
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length >= 3,
    normalize: primitive => {
      // This is a polygon2d primitive which per XVIZ protocol implicitly says
      // that the provided path is closed. Push a copy of first vert to end of array.
      // Array comparison turns out to be expensive. Looks like the polygon returned
      // from XVIS is never closed - worst case we end up with a duplicate end vertex,
      // which will not break the polygon layer.
      primitive.vertices.push(primitive.vertices[0]);
    }
  },
  circle: {
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  circle2d: {
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.center,
    normalize: primitive => {
      primitive.vertices = primitive.center;
    }
  }
};

/* eslint-disable max-depth */
export function normalizeXvizPrimitive(
  primitive,
  objectIndex,
  streamName,
  time,
  postProcessPrimitive
) {
  // as normalizeXvizPrimitive is called for each primitive of every frame
  // it is intentional to mutate the primitive in place
  // to avoid frequent allocate/discard and improve performance

  const {
    // common
    type,
    // line2d, polygon2d
    vertices,
    // circle2d
    center
  } = primitive;

  const {enableZOffset, validate, normalize} = PRIMITIVE_PROCCESSOR[type];

  // Apply a small offset to 2d geometries to battle z fighting
  if (enableZOffset) {
    const zOffset = objectIndex * 1e-6;
    if (vertices) {
      // TODO(twojtasz): this is pretty bad for memory, backend must
      // set all 3 values otherwise we allocate and cause heavy GC
      // TODO - this looks like it could be handled with a model matrix?
      for (let i = 0; i < vertices.length; i++) {
        // Flatten the data for now
        vertices[i][2] = zOffset;
      }
    }
    if (center && center.length === 2) {
      center[2] = zOffset;
    }
  }

  // validate
  if (!validate(primitive, streamName, time)) {
    return null;
  }

  // process
  if (normalize) {
    normalize(primitive);
  }

  // post process
  if (postProcessPrimitive) {
    postProcessPrimitive(primitive);
  }

  return primitive;
}
/* eslint-enable max-depth */
