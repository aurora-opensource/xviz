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
import {XVIZBinaryDataProvider} from '@xviz/io';
import {getBinaryTestDataSource} from './test-data';

const source = getBinaryTestDataSource();

test('XVIZJSONDataProvider#default-ctor init', async t => {
  // Ensure no parameter ctor
  const provider = new XVIZBinaryDataProvider({source});
  await provider.init();
  t.ok(provider.valid(), 'DataProvider is valid');
  t.end();
});

test('XVIZJSONDataProvider#frame iteration', async t => {
  const provider = new XVIZBinaryDataProvider({source});
  await provider.init();
  t.ok(provider.valid(), 'DataProvider is valid');

  const iterator = provider.getFrameIterator(1000.5, 1010.5);

  const testFrame = async timestamp => {
    t.ok(iterator.valid());

    const frame = await provider.xvizFrame(iterator);
    t.ok(frame, 'frame data is present');

    const frameData = frame.message().data;
    t.equals(frameData.updates[0].timestamp, timestamp, 'First frame matches expected value');
  };

  testFrame(1000.5);
  testFrame(1010.5);

  t.not(provider.xvizFrame(iterator), 'iterator is correctly invalid at end');

  t.end();
});
