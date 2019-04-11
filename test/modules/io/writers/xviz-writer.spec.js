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
import {XVIZJSONWriter, XVIZBinaryWriter, XVIZData, MemorySink} from '@xviz/io';

test('XVIZWriter#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  // Ensure no parameter ctor
  const sink = new MemorySink();
  const jsBuilder = new XVIZJSONWriter(sink);
  const binBuilder = new XVIZBinaryWriter(sink);
  t.end();
  /* eslint-enable no-unused-vars */
});

//
//  Test data and cases for successful writer tests
//
const SAMPLE_METADATA = {
  version: '2.0',
  log_info: {
    start_time: 1,
    end_time: 2
  }
};

const SAMPLE_STATE_UPDATE = {
  updates: [
    {
      timestamp: 100
    }
  ]
};

// Type m for metadata, f for frame
const TestCases = [
  {
    name: 'envelope metadata',
    type: 'm',
    data: SAMPLE_METADATA
  },
  {
    name: 'frame',
    type: 'f',
    data: SAMPLE_STATE_UPDATE
  },
  {
    name: 'frame index',
    type: 'f',
    data: SAMPLE_STATE_UPDATE,
    postTest: (t, tc, writer, sink) => {
      writer.writeFrameIndex();
      t.ok(sink.has('0-frame.json'), 'wrote index for frames');
      t.deepEquals(
        JSON.parse(sink.get('0-frame.json')),
        {
          timing: [[100, 100, 0, '2-frame']]
        },
        'json index matches expected'
      );
    }
  }
];

// Setup then test writing meta or frame and validate output
function testWriter(t, testCase, Writer, suffix) {
  const sink = new MemorySink();
  const writer = new Writer(sink, testCase.options);

  if (testCase.preTest) {
    testCase.preTest(t, testCase, writer, sink);
  }

  let lookup = null;
  let resultType = null;
  if (testCase.type === 'm') {
    lookup = '1-frame';
    resultType = 'metadata';
    writer.writeMetadata(testCase.data);
  } else if (testCase.type === 'f') {
    lookup = '2-frame';
    resultType = 'state_update';
    writer.writeFrame(0, testCase.data);
  } else {
    t.fail('Unknown testCase type');
  }

  t.ok(sink.has(`${lookup}.${suffix}`), `wrote json data ${lookup}.${suffix}`);
  const jsMessage = new XVIZData(sink.get(`${lookup}.${suffix}`)).message();
  t.deepEquals(jsMessage.data, testCase.data, 'data matches');
  t.deepEquals(jsMessage.type, resultType, 'type matches');

  if (testCase.postTest) {
    testCase.postTest(t, testCase, writer, sink);
  }
}

test('XVIZWriter#TestCases', t => {
  for (const testCase of TestCases) {
    t.comment(`-- TestCase: ${testCase.name}`);
    testWriter(t, testCase, XVIZJSONWriter, 'json');
    testWriter(t, testCase, XVIZBinaryWriter, 'glb');
  }
  t.end();
});

//
//  Test data and cases for throwing writer tests
//
const ThrowingTestCases = [
  {
    name: 'Missing updates',
    data: {},
    exceptionRegex: /Cannot find timestamp/,
    testMessage: 'Throws if missing updates'
  },
  {
    name: 'Updates missing timestamp',
    data: {
      updates: []
    },
    exceptionRegex: /XVIZ updates did not contain/,
    testMessage: 'Throws if updates missing timestamp'
  },
  {
    name: 'writeFrame after writeFrameIndex',
    data: SAMPLE_STATE_UPDATE,
    preTest: (t, tc, writer, sink) => {
      writer.writeFrame(0, tc.data);
      writer.writeFrameIndex();
    },
    exceptionRegex: /was called after.*last frame of 2-frame/,
    testMessage: 'throws if writeFrame() called after writeFrameIndex()'
  }
];

function testWriterThrows(t, testCase, Writer) {
  const sink = new MemorySink();
  const writer = new Writer(sink, testCase.options);

  if (testCase.preTest) {
    testCase.preTest(t, testCase, writer, sink);
  }

  t.throws(
    () => writer.writeFrame(0, testCase.data),
    testCase.exceptionRegex,
    testCase.testMessage
  );

  if (testCase.postTest) {
    testCase.postTest(t, testCase, writer, sink);
  }
}

// Setup then test writing frame that throws and validate output
test('XVIZWriter#ThrowingTestCases', t => {
  for (const testCase of ThrowingTestCases) {
    t.comment(`-- ThrowTestCase: ${testCase.name}`);
    testWriterThrows(t, testCase, XVIZJSONWriter, 'json');
    testWriterThrows(t, testCase, XVIZBinaryWriter, 'glb');
  }
  t.end();
});

test('XVIZWriter#default-ctor frames writeFrameIndex', t => {
  const sink = new MemorySink();
  const jsBuilder = new XVIZJSONWriter(sink);
  const binBuilder = new XVIZBinaryWriter(sink);

  const data = SAMPLE_STATE_UPDATE;

  for (const builder of [jsBuilder, binBuilder]) {
    builder.writeFrame(0, data);
    builder.writeFrameIndex();

    t.ok(sink.has('0-frame.json'), 'wrote index for frames');

    const expected = {
      timing: [[100, 100, 0, '2-frame']]
    };

    t.deepEquals(JSON.parse(sink.get('0-frame.json')), expected, 'json index matches expected');
  }

  t.end();
});
