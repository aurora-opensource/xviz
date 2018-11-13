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

/* global URL, Blob */
import {filterVertices} from './filter-vertices';
import {PRIMITIVE_CAT} from './parse-xviz-primitive';
import base64js from 'base64-js';

function aliasId(primitive) {
  if (primitive && primitive.base && primitive.base.object_id) {
    primitive.id = primitive.base.object_id;
  }
}

// TODO - tests for all primitive types
export default {
  text: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: primitive => true,
    normalize: primitive => {
      aliasId(primitive);
    }
  },
  circle: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.center,
    normalize: primitive => {
      aliasId(primitive);
    }
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
      aliasId(primitive);
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
      aliasId(primitive);
    }
  },
  point: {
    category: PRIMITIVE_CAT.POINTCLOUD,
    validate: (primitive, streamName, time) => primitive.points && primitive.points.length > 0,
    normalize: primitive => {
      // Alias XVIZ 2.0 to normalized vertices field.
      primitive.vertices = primitive.points;
      aliasId(primitive);
    }
  },
  image: {
    category: PRIMITIVE_CAT.IMAGE,
    validate: (primitive, streamName, time) => primitive.data,
    normalize: primitive => {
      let imageData = primitive.data;
      if (typeof primitive.data === 'string') {
        imageData = base64js.toByteArray(imageData);
      }
      // format is not part of v2 spec
      const imgType = primitive.format ? `image/${primitive.format}` : null;
      const blob = new Blob([imageData], {type: imgType});
      primitive.imageUrl = URL.createObjectURL(blob);
      if (primitive.position) {
        primitive.vertices = primitive.position;
      }
      aliasId(primitive);
    }
  }
};
