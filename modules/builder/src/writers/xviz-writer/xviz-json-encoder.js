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

import base64js from 'base64-js';

// Recursively walk object performing the following conversions
// - primitives with typed array fields are turned into arrays
// - primtives of type image have the data turned into a base64 string
/* eslint-disable complexity */
export function xvizConvertJson(object, keyName, nestedDepth = 0) {
  if (Array.isArray(object)) {
    return object.map(element => xvizConvertJson(element, keyName, nestedDepth + 1));
  }

  // Typed arrays become normal arrays
  // TODO: no way to know if this should be 3 or 4
  if (ArrayBuffer.isView(object)) {
    // Return normal arrays
    if (!(keyName === 'vertices' || keyName === 'points') || nestedDepth > 0) {
      return Array.from(object);
    }

    // For primitives with key's 'vertices', we force nested arrays.
    // TODO(twojtasz): Support flat arrays
    const length = object.length;
    if (length % 3 !== 0) {
      throw new Error('TypeArray conversion failure. The array is expect to be divisible by 3');
    }

    // Construct points from flattened array
    const newObject = [];
    const count = length / 3;
    for (let i = 0; i < count; i++) {
      newObject.push(Array.from(object.slice(i * 3, i * 3 + 3)));
    }
    return newObject;
  }

  if (object !== null && typeof object === 'object') {
    // Handle XVIZ Image Primitive
    const properties = Object.keys(object);
    if (properties.includes('data') && keyName === 'images') {
      return {
        ...object,
        data: base64js.fromByteArray(object.data)
      };
    }

    // Handle all other objects
    const newObject = {};
    for (const key in object) {
      newObject[key] = xvizConvertJson(object[key], key);
    }
    return newObject;
  }

  return object;
}
/* eslint-enable complexity */
