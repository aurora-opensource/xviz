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

/* eslint-disable camelcase */
import test from 'tape-catch';
import {XVIZJSONProvider} from '@xviz/io';
import {getJSONTestDataSource} from './test-data';

const source = getJSONTestDataSource();

test('XVIZJSONProvider#getFrameIterator()', async t => {
  const provider = new XVIZJSONProvider({source});
  await provider.init();
  t.ok(provider.valid(), 'Provider is valid');

  // Default to start/end of index file
  let iterator = provider.getFrameIterator();
  t.equals(iterator.start, 0, 'iterator w/o time starts is 0');
  t.equals(iterator.end, 1, 'iterator w/o time is 1');
  t.equals(iterator.current, 0, 'iterator w/o time current is 0');

  // Clamp to start/end of data
  iterator = provider.getFrameIterator(1000, 1012);
  t.equals(iterator.start, 0, 'iterator start clamped to beginning');
  t.equals(iterator.end, 1, 'iterator end clamped to end');
  t.equals(iterator.current, 0, 'iterator current is 0');

  // Exact start/end of data
  iterator = provider.getFrameIterator(1000.5, 1010.5);
  t.equals(iterator.start, 0, 'iterator start exact at beginning');
  t.equals(iterator.end, 1, 'iterator end exact at end');
  t.equals(iterator.current, 0, 'iterator current is 0');

  // Exact start/end beyond start, start is 1, end is clamped
  iterator = provider.getFrameIterator(1001.5, 1011.5);
  t.equals(iterator.start, 1, 'iterator start at 1');
  t.equals(iterator.end, 1, 'iterator end at 1');
  t.equals(iterator.current, 1, 'iterator current is 1');

  iterator = provider.getFrameIterator(1010.5, 1000.5);
  t.notOk(iterator);

  t.end();
});
