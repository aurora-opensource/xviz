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

function isFlattened(array) {
  return Number.isFinite(array[0]);
}

export function flattenToTypedArray(nestedArray, dimensions = 3, ArrayType = Float32Array) {
  if (nestedArray.length === 0) {
    return new Float32Array(0);
  }

  if (!checkVertices(nestedArray)) {
    return null;
  }

  // Handle case where the array is already flattened.
  if (isFlattened(nestedArray)) {
    return ArrayType.from(nestedArray);
  }

  const count = countVertices(nestedArray, dimensions);

  const typedArray = new ArrayType(count);
  flattenVerticesInPlace(nestedArray, typedArray, dimensions);
  return typedArray;
}

function countVertices(nestedArray, dimensions = 3) {
  let nestedCount = 0;
  let localCount = 0;
  let index = -1;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      nestedCount += countVertices(value);
    } else {
      localCount++;
    }
  }
  return nestedCount + (nestedCount === 0 && localCount < dimensions ? dimensions : localCount);
}

function checkVertices(nestedArray, predicate = Number.isFinite) {
  let index = -1;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      if (!checkVertices(value, predicate)) {
        return false;
      }
    } else if (!predicate(value)) {
      return false;
    }
  }
  return true;
}

function flattenVerticesInPlace(nestedArray, result, dimensions = 3) {
  flattenVerticesInPlaceRecursive(nestedArray, result, dimensions, 0);
  return result;
}

// Flattens nested array of vertices, padding third coordinate as needed
function flattenVerticesInPlaceRecursive(nestedArray, result, dimensions, insert) {
  let index = -1;
  let vertexLength = 0;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      insert = flattenVerticesInPlaceRecursive(value, result, dimensions, insert);
    } else {
      // eslint-disable-next-line
      if (vertexLength < dimensions) {
        result[insert++] = value;
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result[insert++] = 0;
  }
  return insert;
}
