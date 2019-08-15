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
import {XVIZBinaryProvider} from '@xviz/io';
import {getBinaryTestDataSource} from './test-data';

const source = getBinaryTestDataSource();

test('XVIZBinaryProvider#default-ctor init', async t => {
  // Ensure no parameter ctor
  const provider = new XVIZBinaryProvider({source});
  await provider.init();
  t.ok(provider.valid(), 'Provider is valid');
  t.end();
});

test('XVIZBinaryProvider#message iteration', async t => {
  const provider = new XVIZBinaryProvider({source});
  await provider.init();
  t.ok(provider.valid(), 'Provider is valid');

  const iterator = provider.getMessageIterator({startTime: 1000.5, endTime: 1010.5});

  const testMessage = async timestamp => {
    t.ok(iterator.valid());

    const message = await provider.xvizMessage(iterator);
    t.ok(message, 'message data is present');

    const messageData = message.message().data;
    t.equals(messageData.updates[0].timestamp, timestamp, 'First message matches expected value');
  };

  testMessage(1000.5);
  testMessage(1010.5);

  t.not(provider.xvizMessage(iterator), 'iterator is correctly invalid at end');

  t.end();
});
