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

import {
  TextEncoder,
  MemorySink,
  XVIZBinaryWriter,
  XVIZData,
  XVIZFormatWriter,
  XVIZFormat
} from '@xviz/io';

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

tape('XVIZFormatWriter#full matrix', t => {
  const dataSources = [
    TestXVIZSnapshot,
    TestXVIZSnapshotString,
    TestXVIZSnapshotBuffer,
    TestXVIZSnapshotGLB
  ];
  for (const source of dataSources) {
    const xvizObj = new XVIZData(source);

    for (const format of [XVIZFormat.binary, XVIZFormat.jsonBuffer, XVIZFormat.jsonString]) {
      const sink = new MemorySink();

      t.comment(`-- TestCase ${xvizObj.dataFormat()} to ${format}`);

      // Convert the data to the requested format
      // data is state_update and this will default to a frame sequence of 0
      const formatWriter = new XVIZFormatWriter(sink, {format});
      formatWriter.writeFrame(0, xvizObj);

      // We don't really care about the key as each writer will have
      // different identifier, (eg: 1-frame.json vs 1.frame.glb)
      for (const [key, val] of sink.entries()) {
        t.ok(val.length, `${key} has formatted data`);

        // Verify the data is parsed as the expected format
        const newObj = new XVIZData(val);
        t.equal(newObj.dataFormat(), format, `data format matches`);
      }
    }
  }

  t.end();
});

tape('XVIZFormatWriter#frame writing', t => {
  const xvizObj = new XVIZData(TestXVIZSnapshot);
  const sink = new MemorySink();

  const formatWriter = new XVIZFormatWriter(sink, {format: XVIZFormat.binary});

  formatWriter.writeFrame(0, xvizObj);
  formatWriter.writeFrame(1, xvizObj);
  formatWriter.writeFrame(2, xvizObj);

  const expectedKeys = ['2-frame.glb', '3-frame.glb', '4-frame.glb'];
  for (const key of expectedKeys) {
    t.ok(sink.has(key), `entry ${key} was present`);
  }

  t.not(sink.has('1-frame.glb'), 'entry 1-frame.glb was not present');

  t.end();
});
