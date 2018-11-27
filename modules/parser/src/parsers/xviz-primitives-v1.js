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
import {PRIMITIVE_CAT} from './parse-xviz-primitive';

// TODO - tests for all primitive types
export default {
  text: {
    category: PRIMITIVE_CAT.LABEL,
    validate: primitive => true
  },
  // eslint-disable-next-line camelcase
  tree_table: {
    category: PRIMITIVE_CAT.COMPONENT,
    validate: primitive => true
  },
  points3d: {
    category: PRIMITIVE_CAT.POINTCLOUD,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  points2d: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0,
    normalize: primitive => {
      for (let i = 0; i < primitive.vertices.length; i++) {
        primitive.vertices[i][2] = 0;
      }
    }
  },
  point2d: {
    category: PRIMITIVE_CAT.FEATURE,
    enableZOffSet: true,
    validate: (primitive, streamName, time) =>
      primitive.vertices && primitive.vertices.length === 1,
    normalize: primitive => {
      primitive.vertices = primitive.vertices[0];
    }
  },
  line2d: {
    category: PRIMITIVE_CAT.FEATURE,
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
    category: PRIMITIVE_CAT.FEATURE,
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length >= 3,
    normalize: primitive => {
      // This is a polygon2d primitive which per XVIZ protocol implicitly says
      // that the provided path is closed. Push a copy of first vert to end of array.
      // Array comparison turns out to be expensive. Looks like the polygon returned
      // from XVIS is never closed - worst case we end up with a duplicate end vertex,
      // which will not break the polygon layer.
      // TODO - can't handle flat arrays for now
      if (Array.isArray(primitive.vertices)) {
        primitive.vertices.push(primitive.vertices[0]);
      }
    }
  },
  circle: {
    category: PRIMITIVE_CAT.FEATURE,
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  circle2d: {
    category: PRIMITIVE_CAT.FEATURE,
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.center,
    normalize: primitive => {
      primitive.vertices = primitive.center;
    }
  }
};
