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

const PrimitiveTypes = [
  'circles',
  'images',
  'points',
  'polygons',
  'polylines',
  'stadiums',
  'texts'
];

/**
 * Primitives in v2 are a map with the 'type' as the key.
 * This function validates the type and returns underlying array
 *
 */
export function getPrimitiveData(primitiveObject) {
  // v1
  if (primitiveObject.type) {
    return {type: primitiveObject.type, primitiveObject};
  }

  // v2
  const keys = Object.keys(primitiveObject);

  for (const type of keys) {
    if (PrimitiveTypes.includes(type)) {
      // Types in v2 are the plural form, but lookup in xviz-primitives-2.js
      // uses singular, ie points -> point
      const singularType = type.slice(0, -1);
      return {type: singularType, primitives: primitiveObject[type]};
    }
  }

  return null;
}
