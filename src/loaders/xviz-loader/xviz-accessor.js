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

// TODO - New accessor/buffer descriptor format that is more compact than glTFs

const FORMAT_CHAR_TO_ARRAY_TYPE = {
  e: Float64Array,
  f: Float32Array,
  i: Int32Array,
  I: Uint32Array,
  h: Int16Array,
  H: Uint16Array,
  b: Int8Array,
  B: Uint8Array
};

function getFormatCharFromArray(array) {
  switch (array.constructor) {
    case Float64Array:
      return 'e';
    case Float32Array:
      return 'f';
    case Int32Array:
      return 'i';
    case Uint32Array:
      return 'I';
    case Int16Array:
      return 'h';
    case Uint16Array:
      return 'H';
    case Int8Array:
      return 'b';
    case Uint8Array:
      return 'B';
    default:
      return null;
  }
}

export function encodeXVIZAccessSpecifier({array, byteOffset, components = 1}) {
  return [byteOffset, array.byteLengh, getFormatCharFromArray(array), components];
}

export function decodeXVIZAccessSpecifier([
  byteOffset,
  byteLength,
  typeChar = 'f',
  components = 1
]) {
  const ArrayType = FORMAT_CHAR_TO_ARRAY_TYPE[typeChar];
  return {ArrayType};
}
