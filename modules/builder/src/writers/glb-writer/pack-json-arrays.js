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

import {flattenToTypedArray} from '../../utils';

const DEFAULT_TOKENIZE = index => `$$$${index}`;

// Recursively packs objects, replacing typed arrays with "JSON pointers" to binary data
export default function packJsonArrays(json, bufferPacker, options = {}) {
  const {tokenize = DEFAULT_TOKENIZE, flattenArrays = true} = options;
  let object = json;

  if (Array.isArray(object)) {
    // TODO - handle numeric arrays, flatten them etc.
    const typedArray = flattenArrays && flattenToTypedArray(object);
    if (typedArray) {
      object = typedArray;
    } else {
      return object.map(element => packJsonArrays(element, bufferPacker, options));
    }
  }

  // Typed arrays, pack them as binary
  if (ArrayBuffer.isView(object) && bufferPacker) {
    const bufferIndex = bufferPacker.addBuffer(object);
    return tokenize(bufferIndex);
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = packJsonArrays(object[key], bufferPacker, options);
    }
    return newObject;
  }

  return object;
}
