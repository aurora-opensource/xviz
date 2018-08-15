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
 * Adapted from THREE.js under MIT license
 * @author Don McCurdy / https://www.donmccurdy.com
 */

/* global TextDecoder */

export function decodeText(array) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(array);
  }

  // Avoid the String.fromCharCode.apply(null, array) shortcut, which
  // throws a "maximum call stack size exceeded" error for large arrays.

  let s = '';
  for (let i = 0; i < array.length; i++) {
    // Implicitly assumes little-endian.
    s += String.fromCharCode(array[i]);
  }

  // Merges multi-byte utf-8 characters.
  return decodeURIComponent(escape(s));
}

export function extractUrlBase(url) {
  const index = url.lastIndexOf('/');
  return index === -1 ? './' : url.substr(0, index + 1);
}
