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
    validate: primitive => primitive.center,
    normalize: primitive => {
      aliasId(primitive);
    }
  },
  stadium: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: primitive => primitive.start && primitive.end,
    normalize: primitive => {
      aliasId(primitive);
    }
  },
  polyline: {
    category: PRIMITIVE_CAT.FEATURE,
    validate: (primitive, streamName, time) => primitive.vertices && primitive.vertices.length >= 2,
    normalize: primitive => {
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
      delete primitive.data;
      if (typeof imageData === 'string') {
        imageData = base64js.toByteArray(imageData);
      }
      // format is not part of v2 spec
      const imgType = primitive.format ? `image/${primitive.format}` : null;
      primitive.imageData = imageData;
      primitive.imageType = imgType;
      if (primitive.position) {
        primitive.vertices = primitive.position;
      }
      aliasId(primitive);
    }
  }
};
