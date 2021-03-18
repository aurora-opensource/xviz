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
export default function unpackJsonArrays(json, buffers, options = {}) {
  return unpackJsonArraysRecursive(json, json, buffers, options);
}

// Recursively unpacks objects, replacing "JSON pointers" with typed arrays
function unpackJsonArraysRecursive(json, topJson, buffers, options = {}) {
  const object = json;

  const buffer = decodeJSONPointer(object, buffers);
  if (buffer) {
    return buffer;
  }

  // Copy array
  if (Array.isArray(object)) {
    return object.map(element => unpackJsonArraysRecursive(element, topJson, buffers, options));
  }

  // Copy object
  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = unpackJsonArraysRecursive(object[key], topJson, buffers, options);
    }
    return newObject;
  }

  return object;
}

function decodeJSONPointer(object, buffers) {
  const pointer = parseJSONPointer(object);
  if (pointer) {
    const [field, index] = pointer;
    const buffer = buffers[field] && buffers[field][index];
    if (buffer) {
      return buffer;
    }
    console.error(`Invalid JSON pointer ${object}: #/${field}/${index}`); // eslint-disable-line
  }
  return null;
}

function parseJSONPointer(value) {
  if (typeof value === 'string') {
    // Remove escape character
    if (value.indexOf('##/') === 0) {
      return value.slice(1);
    }

    let matches = value.match(/#\/([a-z]+)\/([0-9]+)/);
    if (matches) {
      const index = parseInt(matches[2], 10);
      return [matches[1], index];
    }

    // Legacy: `$$$i`
    matches = value.match(/\$\$\$([0-9]+)/);
    if (matches) {
      const index = parseInt(matches[1], 10);
      return ['accessors', index];
    }
  }

  return null;
}
