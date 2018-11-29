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
import {findInsertPos, INSERT_POSITION as IP} from '@xviz/parser/utils/search';

const testTimeslices = [
  {timestamp: 100},
  {timestamp: 200},
  {timestamp: 300},
  {timestamp: 400},
  {timestamp: 500}
];

test('findInsertPos#position in middle of array', t => {
  let pos = findInsertPos(testTimeslices, 200, IP.LEFT);
  t.equal(pos, 1, 'Left insert position is 1');

  pos = findInsertPos(testTimeslices, 200, IP.RIGHT);
  t.equal(pos, 2, 'Right insert position is 2');

  t.end();
});

test('findInsertPos#position at 0', t => {
  let pos = findInsertPos(testTimeslices, 50, IP.LEFT);
  t.equal(pos, 0, 'Left insert position is 0');

  pos = findInsertPos(testTimeslices, 50, IP.RIGHT);
  t.equal(pos, 0, 'Right insert position is 0');

  t.end();
});

test('findInsertPos#position at beginning of array', t => {
  let pos = findInsertPos(testTimeslices, 100, IP.LEFT);
  t.equal(pos, 0, 'Left insert position is 0');

  pos = findInsertPos(testTimeslices, 100, IP.RIGHT);
  t.equal(pos, 1, 'Right insert position is 1');

  t.end();
});

test('findInsertPos#position at end of array', t => {
  let pos = findInsertPos(testTimeslices, 500, IP.LEFT);
  t.equal(pos, 4, 'Left insert position is 4');

  pos = findInsertPos(testTimeslices, 500, IP.RIGHT);
  t.equal(pos, 5, 'Right insert position is 5');

  t.end();
});

test('findInsertPos#position past end of array', t => {
  let pos = findInsertPos(testTimeslices, 600, IP.LEFT);
  t.equal(pos, 5, 'Left insert position is 5');

  pos = findInsertPos(testTimeslices, 600, IP.RIGHT);
  t.equal(pos, 5, 'Right insert position is 5');

  t.end();
});
