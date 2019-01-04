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

import {getXVIZConfig} from '../config/xviz-config';

const PrimitiveTypes = [
  'circles',
  'images',
  'points',
  'polygons',
  'polylines',
  'stadiums',
  'texts'
];

export function parseVersionString(versionString) {
  const versionSplit = versionString.split('.');
  let major = null;
  let minor = null;
  let patch = null;

  let field = versionSplit.shift();
  if (field) {
    major = Number.parseInt(field, 10);
  }

  field = versionSplit.shift();
  if (field) {
    minor = Number.parseInt(field, 10);
  }

  field = versionSplit.shift();
  if (field) {
    patch = Number.parseInt(field, 10);
  }

  return {major, minor, patch};
}

/**
 * Primitives in v2 are a map with the 'type' as the key.
 * This function validates the type and returns underlying array
 *
 */
export function getPrimitiveData(primitiveObject) {
  const {currentMajorVersion} = getXVIZConfig();

  if (currentMajorVersion === 1) {
    if (primitiveObject instanceof Array) {
      if (primitiveObject.length === 0) {
        // The empty array implies 'no data' for this object, which is distinct
        // from 'absence of data' which would happen if there was not primitive entry at all
        return {type: null, primitives: primitiveObject};
      } else if (primitiveObject.length > 0) {
        // This is populated primitive data
        return {type: primitiveObject[0].type, primitives: primitiveObject};
      }
    }
  }

  if (currentMajorVersion === 2) {
    // Primitives have the type as the first key
    const keys = Object.keys(primitiveObject);

    for (const type of keys) {
      if (PrimitiveTypes.includes(type)) {
        // Types in v2 are the plural form, but lookup in xviz-primitives-2.js
        // uses singular, ie points -> point
        const singularType = type.slice(0, -1);
        return {type: singularType, primitives: primitiveObject[type]};
      }
    }
  }

  // TODO(twojtasz): Cleanup data flow as downstream expects an object rather than an error.
  return {};
}

/**
 *  Turns arrays from [1, 2, 3, 4, 5, 6] to [[1, 2, 3], [4, 5, 6]]. The array
 *  must have a length a multiple of 3.
 */
export function unFlattenVertices(vertices) {
  const result = [];
  for (let i = 0; i < vertices.length; i = i + 3) {
    result.push([vertices[i], vertices[i + 1], vertices[i + 2]]);
  }

  return result;
}

/**
 *  Unflattens an array only if it's already flat. Only works on arrays with a
 *  length that is a multiple of 3.
 */
export function ensureUnFlattenedVertices(vertices) {
  if (vertices.length > 0 && !Array.isArray(vertices[0])) {
    return unFlattenVertices(vertices);
  }

  return vertices;
}
