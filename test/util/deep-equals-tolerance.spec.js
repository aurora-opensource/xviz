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
import clone from 'clone';

import {default as deepEqualsTolerance} from './deep-equals-tolerance';

const testObject = {
  boolType: true,
  nullType: null,
  undefinedType: undefined,
  strType: 'This is a string',
  intType: 23,
  numberType1: 2.34,
  numberType2: 2.334243,
  numberType3: 210.330237,
  numberType4: 2100.330236,
  arrayType: [1, 2, 3],
  arrayNestedType: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  objectType: {
    a: 1,
    b: 23.3,
    c: ['a', 'b', 'c']
  }
};

const testCases = [
  {
    field: 'boolType',
    value: false
  },
  {
    field: 'nullType',
    value: 1
  },
  {
    field: 'undefinedType',
    value: 1
  },
  {
    field: 'strType',
    value: 'Not the same'
  },
  {
    field: 'intType',
    value: 24
  },
  {
    field: 'arrayType',
    value: [1, 2, 3, 4]
  },
  {
    field: 'arrayType',
    value: [2, 4, 6]
  },
  {
    field: 'arrayNestedType',
    value: [[1, 2, 3]]
  },
  {
    field: 'objectType',
    value: {
      a: 2,
      b: 23.3,
      c: ['a', 'b', 'c']
    }
  }
];

test('deepEqualsTolerance', t => {
  let expected = clone(testObject);
  t.ok(deepEqualsTolerance(expected, testObject), 'Cloned object is equal');

  expected = clone(testObject);
  expected.numberType1 += 1e-6;
  t.notOk(
    deepEqualsTolerance(expected, testObject),
    'Number with difference greater than tolerance fails'
  );
  t.ok(
    deepEqualsTolerance(expected, testObject, {numberTolerance: 1e-5}),
    'numberTolerance change allows prior test to pass equality test'
  );

  expected = clone(testObject);
  expected.numberType1 += 1e-8;
  t.ok(
    deepEqualsTolerance(expected, testObject),
    'Number with difference less than tolerance passes'
  );
  t.notOk(
    deepEqualsTolerance(expected, testObject, {numberTolerance: 1e-9}),
    'numberTolerance change allow prior test to fail equality test'
  );

  testCases.forEach(tcase => {
    expected = clone(testObject);
    expected[tcase.field] = tcase.value;
    t.notOk(
      deepEqualsTolerance(expected, tcase),
      `${tcase.field} change results in failing equality`
    );
  });

  t.end();
});
