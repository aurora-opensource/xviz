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
import {MemorySourceSink} from '@xviz/io';

const index = {
  startTime: 1000.5,
  endTime: 1010.5,
  timing: [[1000.5, 1000.5, 0, '2-frame'], [1010.5, 1010.5, 1, '3-frame']]
};
const metadata = {
  version: '2.0.0'
};
const frame1 = {
  type: 'xviz/state_update',
  data: {
    update_type: 'snapshot',
    updates: [
      {
        timestamp: 1000.5
      }
    ]
  }
};
const frame2 = {
  type: 'xviz/state_update',
  data: {
    update_type: 'snapshot',
    updates: [
      {
        timestamp: 1010.5
      }
    ]
  }
};

export function getJSONTestDataSource() {
  const source = new MemorySourceSink();
  source.writeSync('0-frame.json', index);
  source.writeSync('1-frame.json', metadata);
  source.writeSync('2-frame.json', frame1);
  source.writeSync('3-frame.json', frame2);

  return source;
}

export function getBinaryTestDataSource() {
  const source = new MemorySourceSink();
  source.writeSync('0-frame.json', index);
  source.writeSync('1-frame.glb', metadata);
  source.writeSync('2-frame.glb', frame1);
  source.writeSync('3-frame.glb', frame2);

  return source;
}
