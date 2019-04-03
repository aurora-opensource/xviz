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
import tape from 'tape-catch';

import {XVIZData, XVIZBinaryWriter, TextEncoder} from '@xviz/io';

// Source test data
import TestXVIZSnapshot from 'test-data/sample-xviz';

// Various formats for the test data
const TestXVIZSnapshotString = JSON.stringify(TestXVIZSnapshot);
const TestXVIZSnapshotBuffer = new TextEncoder().encode(JSON.stringify(TestXVIZSnapshot));
let TestXVIZSnapshotGLB = null;

// make binary in memory
const writer = new XVIZBinaryWriter({
  writeSync: (n, d) => {
    TestXVIZSnapshotGLB = d;
  }
});
writer.writeFrame(0, TestXVIZSnapshot);

// Load the data in XVIZData and verify the dataFormat
const TestCases = [
  {
    data: TestXVIZSnapshot,
    dataFormat: 'object'
  },
  {
    data: TestXVIZSnapshotString,
    dataFormat: 'json_string'
  },
  {
    data: TestXVIZSnapshotBuffer,
    dataFormat: 'json_buffer'
  },
  {
    data: TestXVIZSnapshotGLB,
    dataFormat: 'binary'
  }
];

tape('XVIZData#constructor', t => {
  for (const test of TestCases) {
    t.comment(`-- TestCase ${test.dataFormat}`);
    const xvizObj = new XVIZData(test.data);
    t.equal(xvizObj.dataFormat(), test.dataFormat, `data as ${test.name} has expected dataFormat`);

    const msg = xvizObj.message();
    t.equal(msg.type, 'state_update', `data as ${test.name} has expected XVIZ type`);
    t.ok(msg.data.updates[0].timestamp, `data as ${test.name} has expected timestamp present`);
  }

  t.end();
});
