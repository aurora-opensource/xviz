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

const typedArray = Float32Array.from([1, 1, 1, 2, 2, 2, 3, 3, 3]);
const nestedTypedArray = new Array(3);
nestedTypedArray[0] = typedArray.subarray(0, 3);
nestedTypedArray[1] = typedArray.subarray(3, 6);
nestedTypedArray[2] = typedArray.subarray(6);

const FLATTEN_VERTICES_TEST_CASES = [
  {
    title: 'empty array',
    argument: [],
    result: []
  },
  {
    title: 'flat arrays',
    argument: [1, 2, 3],
    result: [1, 2, 3]
  },
  {
    title: 'nested one level',
    argument: [[1, 2], [1, 2, 3]],
    result: [1, 2, 0, 1, 2, 3]
  },
  {
    title: 'typed array',
    argument: typedArray,
    result: [1, 1, 1, 2, 2, 2, 3, 3, 3]
  },
  {
    title: 'nested typed array',
    argument: nestedTypedArray,
    result: [1, 1, 1, 2, 2, 2, 3, 3, 3]
  }

  // {
  //   title: 'nested empty',
  //   argument: [1, [1, 2, 3], 3],
  //   result: [1, 1, 2, 3, 3, 0]
  // }
];

test('flatten#import', t => {
  t.ok(typeof flattenToTypedArray === 'function', 'flattenToTypedArray imported OK');
  t.end();
});

test('flatten#flattenToTypedArray', t => {
  for (const tc of FLATTEN_VERTICES_TEST_CASES) {
    const result = flattenToTypedArray(tc.argument);
    t.deepEqual(result, tc.result, `flattenToTypedArray ${tc.title} returned expected result`);
  }
  t.end();
});
