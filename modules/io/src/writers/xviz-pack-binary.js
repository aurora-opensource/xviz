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

// TODO(twojtasz): This appears broken in loaders, fix then update here
// import {flattenToTypedArray} from '@loaders.gl/core';
import {flattenToTypedArray} from '@xviz/builder';

function packBinaryJsonTypedArray(gltfBuilder, object, objectKey) {
  // This will read the bytes and sniff the data type
  if (gltfBuilder.isImage(object)) {
    const imageIndex = gltfBuilder.addImage(object);
    return `#/images/${imageIndex}`;
  }
  // if not an image, pack as accessor
  const opts = objectKey === 'colors' ? {size: 4} : {size: 3};
  const bufferIndex = gltfBuilder.addBuffer(object, opts);
  return `#/accessors/${bufferIndex}`;
}

// Handle arrays and optimize if appropriate
export function optimizeArrays(object, gltfBuilder, objectKey = null, options) {
  const {flattenArrays = false} = options;
  const toTypedArrayMinimumLength = 20;

  // For specific keys make sure the type is correct, default is Float32Array
  const KeyToArrayType = {
    colors: Uint8Array
  };

  // For now we limit the keys we will turn into flattened TypedArrays
  // - 'vertices' are for polygon and polyline once deck.gl path is functional
  // - 'doubles' & 'int32s' are for variables and timeseries data types
  const flattenableObjectKeys = ['points', 'colors', 'data' /* 'vertices', 'doubles', 'int32s' */];

  // Only bother with specific keys and lengths (due to overhead of glb buffer accessors)
  if (!flattenableObjectKeys.includes(objectKey) || object.length < toTypedArrayMinimumLength) {
    return null;
  }

  const typedArray =
    flattenArrays && flattenToTypedArray(object, KeyToArrayType[objectKey] || Float32Array);
  // If flattening was successful, pack in GLB
  if (typedArray) {
    return packBinaryJsonTypedArray(gltfBuilder, typedArray, objectKey);
  } else if (Number.isFinite(object[0])) {
    // If the array is already flattened and numeric, don't map over each element
    return object;
  }

  // return original object unchanged
  return null;
}

// packBinaryJson will place any TypedArrays into the BIN chunk
// of the GLB.
//
// The option 'flattenArrays' will look at certain objects and if they
// can be optimized will be flattened and converted to TypedArrays.
//
// The set of XVIZ entries that can be optimized is limited to those
// that benefit from the storage and is supported in the data flow.
//
// Major benefits come from images and point cloud data.
//
// Follows a convention used by @loaders.gl to use JSONPointers
// to encode where the binary data for a XVIZ element resides.
// The unpacking is handled automatically by @loaders.gl
export function packBinaryJson(json, gltfBuilder, objectKey = null, options = {}) {
  const object = json;

  // Check if string has same syntax as our "JSON pointers", if so "escape it".
  if (typeof object === 'string' && object.indexOf('#/') === 0) {
    return `#${object}`;
  }

  // optimize normal arrays
  if (Array.isArray(object)) {
    const newArray = optimizeArrays(object, gltfBuilder, objectKey, options);
    if (newArray) {
      return newArray;
    }

    // if a new array was not returned, recurse
    return object.map(element => packBinaryJson(element, gltfBuilder, objectKey, options));
  }

  // Typed arrays, pack them as binary
  if (ArrayBuffer.isView(object) && gltfBuilder) {
    return packBinaryJsonTypedArray(gltfBuilder, object, objectKey);
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = packBinaryJson(object[key], gltfBuilder, key, options);
    }
    return newObject;
  }

  return object;
}
