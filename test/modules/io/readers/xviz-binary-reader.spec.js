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
import {XVIZBinaryReader, MemorySourceSink} from '@xviz/io';

test('XVIZBinaryReader#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  // Ensure no parameter ctor
  const source = new MemorySourceSink();
  const binBuilder = new XVIZBinaryReader(source);
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZBinaryReader#log timing', t => {
  const source = new MemorySourceSink();
  const testData = {
    startTime: 1000.5,
    endTime: 1010.5,
    timing: [[1000.5, 1000.5, 0, '2-frame'], [1010.5, 1010.5, 1, '3-frame']]
  };

  source.writeSync('0-frame.json', testData);

  const binBuilder = new XVIZBinaryReader(source);
  const range = binBuilder.timeRange();

  t.ok(Math.abs(range.startTime - 1000.5) < Number.EPSILON, 'timeRange start correct ');
  t.ok(Math.abs(range.endTime - 1010.5) < Number.EPSILON, 'timeRange end correct');
  t.end();
});

test('XVIZBinaryReader#readMetadata', t => {
  const source = new MemorySourceSink();
  const binBuilder = new XVIZBinaryReader(source);

  const testData = {
    version: '2.0.0'
  };

  source.writeSync('1-frame.glb', testData);
  const result = binBuilder.readMetadata();

  t.deepEquals(result, testData, 'readMetadata works with object');
  t.end();
});

test('XVIZBinaryReader#readMetadata as json', t => {
  const source = new MemorySourceSink();
  const binBuilder = new XVIZBinaryReader(source);

  const testData = {
    version: '2.0.0'
  };

  source.writeSync('1-frame.json', testData);
  const result = binBuilder.readMetadata();

  t.deepEquals(result, testData, 'readMetadata works with json');
  t.end();
});

test('XVIZBinaryReader#readMessage', t => {
  const source = new MemorySourceSink();
  const binBuilder = new XVIZBinaryReader(source);

  const testData = {
    type: 'xviz/state_update',
    data: {
      update_type: 'snapshot'
    }
  };

  source.writeSync('2-frame.glb', testData);
  const result = binBuilder.readMessage(0);

  t.deepEquals(result, testData, 'readMessage(0) works with object');
  t.end();
});
