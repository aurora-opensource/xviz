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
/* global Buffer */
import tape from 'tape-catch';

import {XVIZData, XVIZBinaryWriter, XVIZFormat, TextEncoder} from '@xviz/io';

// Enveloped glb as ArrayBuffer
import MinimalBinaryMetadata from 'test-data/minimal-metadata';
import MinimalBinaryStateUpdate from 'test-data/minimal-state-update';

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
writer.writeMessage(0, TestXVIZSnapshot);

// Load the data in XVIZData and verify the format
const TestCases = [
  {
    data: TestXVIZSnapshot,
    description: 'XVIZ Object',
    format: XVIZFormat.OBJECT
  },
  {
    data: TestXVIZSnapshotString,
    description: 'XVIZ String',
    format: XVIZFormat.JSON_STRING
  },
  {
    data: `   ${TestXVIZSnapshotString}   `,
    description: 'XVIZ String with whitespace head and tail',
    format: XVIZFormat.JSON_STRING
  },
  {
    data: TestXVIZSnapshotBuffer,
    description: 'XVIZ String Buffer',
    format: XVIZFormat.JSON_BUFFER
  },
  {
    data: TestXVIZSnapshotGLB,
    description: 'XVIZ Binary Buffer',
    format: XVIZFormat.BINARY_GLB
  },
  {
    data: Buffer.from(TestXVIZSnapshotBuffer),
    description: 'XVIZ String NodeBuffer',
    format: XVIZFormat.JSON_BUFFER,
    nodeOnly: true
  },
  {
    data: Buffer.from(TestXVIZSnapshotGLB),
    description: 'XVIZ Binary NodeBuffer',
    format: 'BINARY_GLB',
    nodeOnly: true
  }
];

tape('XVIZData#constructor', t => {
  const isBrowser = typeof window !== 'undefined';

  for (const test of TestCases) {
    if (test.nodeOnly === true && isBrowser) {
      continue; // eslint-disable-line no-continue
    }

    const xvizObj = new XVIZData(test.data);
    t.equal(
      xvizObj.format,
      test.format,
      `${test.description} matches expected format ${test.format}`
    );

    const msg = xvizObj.message();
    t.equal(msg.type, 'STATE_UPDATE', `${test.description} has expected XVIZ type`);
    t.ok(msg.data.updates[0].timestamp, `${test.description} has expected timestamp present`);
  }

  t.end();
});

tape('XVIZData#type', t => {
  const testCases = [
    {
      description: 'Binary Metadata',
      data: MinimalBinaryMetadata,
      format: XVIZFormat.BINARY_GLB,
      type: 'METADATA'
    },
    {
      description: 'Binary StateUpdate',
      data: MinimalBinaryStateUpdate,
      format: XVIZFormat.BINARY_GLB,
      type: 'STATE_UPDATE'
    }
  ];

  for (const test of testCases) {
    const xvizObj = new XVIZData(test.data);
    t.equal(
      xvizObj.format,
      test.format,
      `${test.description} matches expected format ${test.format}`
    );

    t.equal(xvizObj.type, test.type, `${test.description} matches expected type ${test.type}`);

    const msg = xvizObj.message();
    t.equal(msg.type, test.type, `${test.description} matches expected message type ${test.type}`);
  }

  t.end();
});
