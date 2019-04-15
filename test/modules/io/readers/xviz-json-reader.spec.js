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
import {XVIZJSONReader, MemorySource} from '@xviz/io';

test('XVIZJSONReader#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  // Ensure no parameter ctor
  const source = new MemorySource();
  const binBuilder = new XVIZJSONReader(source);
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZJSONReader#readFrameIndex', t => {
  const source = new MemorySource();
  const binBuilder = new XVIZJSONReader(source);

  const testData = {
    startTime: 1000.5,
    endTime: 1010.5,
    timing: [[1000.5, 1000.5, 0, '2-frame'], [1010.5, 1010.5, 1, '3-frame']]
  };

  source.set('0-frame.json', testData);
  const result = binBuilder.readFrameIndex();

  t.deepEquals(result, testData, 'readFrameIndex works with object');
  t.end();
});

test('XVIZJSONReader#readMetadata', t => {
  const source = new MemorySource();
  const binBuilder = new XVIZJSONReader(source);

  const testData = {
    version: '2.0.0'
  };

  source.set('1-frame.json', testData);
  const result = binBuilder.readMetadata();

  t.deepEquals(result, testData, 'readMetadata works with object');
  t.end();
});

test('XVIZJSONReader#readFrame', t => {
  const source = new MemorySource();
  const binBuilder = new XVIZJSONReader(source);

  const testData = {
    type: 'xviz/state_update',
    data: {
      update_type: 'snapshot'
    }
  };

  source.set('2-frame.json', testData);
  const result = binBuilder.readFrame(0);

  t.deepEquals(result, testData, 'readFrame(0) works with object');
  t.end();
});
