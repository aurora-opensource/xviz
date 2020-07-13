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
// TODO - remove
import {getAccessorTypeFromSize, getComponentTypeFromArray} from './gltf-utils';

// Returns a fresh attributes object with glTF-standardized attributes names
// Attributes that cannot be identified will not be included
// Removes `indices` if present, as it should be stored separately from the attributes
export function getGLTFAccessors(attributes) {
  const accessors = {};
  for (const name in attributes) {
    const attribute = attributes[name];
    if (name !== 'indices') {
      const glTFAccessor = getGLTFAccessor(attribute);
      accessors[name] = glTFAccessor;
    }
  }
  return accessors;
}

// Fix up a single accessor.
// Input: typed array or a partial accessor object
// Return: accessor object
export function getGLTFAccessor(attribute, gltfAttributeName) {
  const {buffer, size, count} = getAccessorData(attribute, gltfAttributeName);

  const glTFAccessor = {
    // TODO: Deprecate `value` in favor of bufferView?
    value: buffer,
    size, // Decoded `type` (e.g. SCALAR)

    // glTF Accessor values
    // TODO: Instead of a bufferView index we could have an actual buffer (typed array)
    bufferView: null,
    byteOffset: 0,
    count,
    type: getAccessorTypeFromSize(size),
    componentType: getComponentTypeFromArray(buffer)
  };

  return glTFAccessor;
}

export function getGLTFAttribute(data, gltfAttributeName) {
  return data.attributes[data.glTFAttributeMap[gltfAttributeName]];
}

function getAccessorData(attribute, attributeName) {
  let buffer = attribute;
  let size = 1;
  let count = 0;

  if (attribute && attribute.value) {
    buffer = attribute.value;
    size = attribute.size || 1;
  }

  if (buffer) {
    if (!ArrayBuffer.isView(buffer)) {
      buffer = toTypedArray(buffer, Float32Array);
    }
    count = buffer.length / size;
  }

  return {buffer, size, count};
}

// Convert non-typed arrays to arrays of specified format
function toTypedArray(array, ArrayType, convertTypedArrays = false) {
  if (!array) {
    return null;
  }
  if (Array.isArray(array)) {
    return new ArrayType(array);
  }
  if (convertTypedArrays && !(array instanceof ArrayType)) {
    return new ArrayType(array);
  }
  return array;
}
