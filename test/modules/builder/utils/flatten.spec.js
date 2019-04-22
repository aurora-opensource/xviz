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

import test from 'tape-catch';
import {flattenToTypedArray} from '@xviz/builder/utils';

test('flattenToTypedArray#vertices', t => {
  const vertices = [[10.0, 50.7, 23.4], [12.0, 50.2, 24.2]];
  const expected = Float32Array.from([10.0, 50.7, 23.4, 12.0, 50.2, 24.2]);

  const newArray = flattenToTypedArray(vertices);

  t.deepEqual(newArray, expected, 'flattenToTypedArray matches expected output');
  t.end();
});

test('flattenToTypedArray#color 4', t => {
  const colors = [[10, 50, 23, 255], [12, 50, 24, 255]];
  const expected = Uint8Array.from([10, 50, 23, 255, 12, 50, 24, 255]);

  const newArray = flattenToTypedArray(colors, Uint8Array);

  t.deepEqual(newArray, expected, 'flattenToTypedArray matches expected output');
  t.end();
});

test('flattenToTypedArray#color 3', t => {
  const colors = [[10, 50, 23], [12, 50, 24]];
  const expected = Uint8Array.from([10, 50, 23, 12, 50, 24]);

  const newArray = flattenToTypedArray(colors, Uint8Array);

  t.deepEqual(newArray, expected, 'flattenToTypedArray matches expected output');
  t.end();
});

test('flattenToTypedArray#color', t => {
  const colors = [10, 50, 23, 255, 12, 50, 24, 255];
  const expected = Uint8Array.from([10, 50, 23, 255, 12, 50, 24, 255]);

  const newArray = flattenToTypedArray(colors, Uint8Array, 4);

  t.deepEqual(newArray, expected, 'flattenToTypedArray matches expected output');
  t.end();
});

test('flattenToTypedArray#zero array returns null', t => {
  const newArray = flattenToTypedArray([]);

  t.equal(newArray, null, 'flattenToTypedArray with 0 length input returns null');
  t.end();
});

test('flattenToTypedArray#array with objects', t => {
  const newArray = flattenToTypedArray([{a: 1}]);

  t.equal(newArray, null, 'flattenToTypedArray with array of objects returns null');
  t.end();
});
