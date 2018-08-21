import {filterVertices} from './filter-vertices';
import {PRIMITIVE_CAT} from './parse-xviz-stream';

/* eslint-disable */
export default {
  text: {
    category: PRIMITIVE_CAT.label,
    validate: _ => true
  },
  tree_table: {
    category: PRIMITIVE_CAT.component,
    validate: _ => true
  },
  points3d: {
    category: PRIMITIVE_CAT.pointCloud,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  points2d: {
    category: PRIMITIVE_CAT.feature,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0,
    normalize: primitive => {
      for (let i = 0; i < primitive.vertices.length; i++) {
        primitive.vertices[i][2] = 0;
      }
    }
  },
  point2d: {
    category: PRIMITIVE_CAT.feature,
    enableZOffSet: true,
    validate: (primitive, streamName, time) =>
      primitive.vertices && primitive.vertices.length === 1,
    normalize: primitive => {
      primitive.vertices = primitive.vertices[0];
    }
  },
  line2d: {
    category: PRIMITIVE_CAT.feature,
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
    category: PRIMITIVE_CAT.feature,
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
    category: PRIMITIVE_CAT.feature,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  circle2d: {
    category: PRIMITIVE_CAT.feature,
    enableZOffset: true,
    validate: (primitive, streamName, time) => primitive.center,
    normalize: primitive => {
      primitive.vertices = primitive.center;
    }
  }
};
