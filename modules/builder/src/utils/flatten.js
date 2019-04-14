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

/**
 * Flattens a nested array into a single level array,
 * or a single value into an array with one value
 * @example flatten([[1, [2]], [3], 4]) => [1, 2, 3, 4]
 * @example flatten(1) => [1]
 * @param {Array} array The array to flatten.
 * @param {Function} filter= - Optional predicate called on each `value` to
 *   determine if it should be included (pushed onto) the resulting array.
 * @param {Function} map= - Optional transform applied to each array elements.
 * @param {Array} result=[] - Optional array to push value into
 * @return {Array} Returns the new flattened array (new array or `result` if provided)
 */
export function flatten(array, {filter = () => true, map = x => x, result = []} = {}) {
  // Wrap single object in array
  if (!Array.isArray(array)) {
    return filter(array) ? [map(array)] : [];
  }
  // Deep flatten and filter the array
  return flattenArray(array, filter, map, result);
}

// Deep flattens an array. Helper to `flatten`, see its parameters
function flattenArray(array, filter, map, result) {
  let index = -1;
  while (++index < array.length) {
    const value = array[index];
    if (Array.isArray(value)) {
      flattenArray(value, filter, map, result);
    } else if (filter(value)) {
      result.push(map(value));
    }
  }
  return result;
}

export function countVertices(nestedArray, dimensions = 3) {
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

// Flattens nested array of vertices, padding third coordinate as needed
export function flattenVertices(nestedArray, {result = [], dimensions = 3} = {}) {
  let index = -1;
  let vertexLength = 0;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      flattenVertices(value, {result, dimensions});
    } else {
      // eslint-disable-next-line
      if (vertexLength < dimensions) {
        result.push(value);
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result.push(0);
  }
  return result;
}

// Returns the dimension of the nested array
function isNestedDimension(array) {
  const isNested = array.length && Array.isArray(array) && Array.isArray(array[0]);
  if (isNested) {
    return array[0].length;
  }
  return 0;
}

export function flattenToTypedArray(nestedArray, ArrayType = Float32Array, dimensions) {
  if (nestedArray.length === 0) {
    return new Float32Array(0);
  }

  if (!checkVertices(nestedArray)) {
    return null;
  }

  // Handle case where it's not nested
  const dim = isNestedDimension(nestedArray);
  if (dim === 0) {
    return ArrayType.from(nestedArray);
  }

  const count = countVertices(nestedArray);

  const typedArray = new ArrayType(count);
  flattenVerticesInPlace(nestedArray, typedArray, dimensions || dim);
  return typedArray;
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
