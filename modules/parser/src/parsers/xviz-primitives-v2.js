import {filterVertices} from './filter-vertices';
import {PRIMITIVE_CAT} from './parse-xviz-stream';

// TODO - tests for all primitive types
export default {
  text: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: primitive => true
  },
  tree_table: {
    category: PRIMITIVE_CAT.COMPONENT,
    validate: primitive => true
  },
  circle: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.center
  },
  polyline: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length >= 2,
    normalize: primitive => {
      // z is required by filterVertices
      primitive.vertices.forEach(v => {
        v[2] = v[2] || 0;
      });
      // Filter out identical vertices to make sure we don't get rendering artifacts
      // in the path layer
      // TODO - handle this directly in deck.gl PathLayer
      primitive.vertices = filterVertices(primitive.vertices);
    }
  },
  polygon: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length >= 3,
    normalize: primitive => {
      // This is a polygon primitive which per XVIZ protocol implicitly says
      // that the provided path is closed. Push a copy of first vert to end of array.
      // Array comparison turns out to be expensive. Looks like the polygon returned
      // from XVIS is never closed - worst case we end up with a duplicate end vertex,
      // which will not break the polygon layer.
      primitive.vertices.push(primitive.vertices[0]);
    }
  },
  point: {
    category: PRIMITIVE_CAT.POINTCLOUD,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length > 0
  },
  image: {
    category: PRIMITIVE_CAT.IMAGE,
    validate: (primitive, streamName, time) => primitive.data,
    normalize: primitive => {
      const arrayBuffer = primitive.data;
      const imgType = primitive.format ? `image/${primitive.format}` : null;
      const blob = new Blob([arrayBuffer], {type: imgType});
      primitive.imageUrl = URL.createObjectURL(blob);
    }
  }
};
