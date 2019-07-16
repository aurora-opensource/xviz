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
/* eslint-disable camelcase, no-unused-vars */
import test from 'tape-catch';
import {XVIZProtobufWriter, XVIZData, MemorySourceSink} from '@xviz/io';
import {XVIZ_PROTOBUF_MESSAGE} from '@xviz/io';

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

test('XVIZProtobufWriter#validate', t => {
  t.equals(
    XVIZ_PROTOBUF_MESSAGE.Metadata.verify(SAMPLE_METADATA),
    null,
    'No error verifying metadata'
  );
  t.equals(
    XVIZ_PROTOBUF_MESSAGE.StateUpdate.verify(SAMPLE_STATE_UPDATE),
    null,
    'No error verifying state_update'
  );
  t.end();
});

const PRIMARY_POSE_STREAM = '/vehicle_pose';
const DEFAULT_POSE = {
  timestamp: 1.0,
  map_origin: {longitude: 1.1, latitude: 2.2, altitude: 3.3},
  position: [11, 22, 33],
  orientation: [0.11, 0.22, 0.33]
};

function makeFrame(points, colors) {
  return {
    update_type: 'snapshot',
    updates: [
      {
        timestamp: 1.0,
        poses: {
          [PRIMARY_POSE_STREAM]: DEFAULT_POSE
        },
        primitives: {
          '/test/points': {
            points: [
              {
                base: {
                  object_id: '1'
                },
                points,
                colors
              }
            ]
          }
        }
      }
    ]
  };
}

// When XVIZData is passed an Uint8Array the magic checks expect a
// arraybuffer to pass to the dataview, not a typed array
test.skip('XVIZProtobufWriter#points', t => {
  const points_flat = [1, 1, 1, 2, 2, 2, 3, 3, 3];
  const colors_flat = [10, 10, 10, 255, 20, 20, 20, 255, 30, 30, 30, 255];

  const points_nested = [[1, 1, 1], [2, 2, 2], [3, 3, 3]];
  const colors_nested = [[10, 10, 10, 255], [20, 20, 20, 255], [30, 30, 30, 255]];

  const points_typed = Float32Array.from([1, 1, 1, 2, 2, 2, 3, 3, 3]);
  const colors_typed = Uint8Array.from([10, 10, 10, 255, 20, 20, 20, 255, 30, 30, 30, 255]);

  const points_typed_nested = [
    Float32Array.from([1, 1, 1]),
    Float32Array.from([2, 2, 2]),
    Float32Array.from([3, 3, 3])
  ];
  const colors_typed_nested = [
    Uint8Array.from([10, 10, 10, 255]),
    Uint8Array.from([20, 20, 20, 255]),
    Uint8Array.from([30, 30, 30, 255])
  ];

  // Generate a frame with specific points and colors
  [
    makeFrame(points_flat, colors_flat),
    makeFrame(points_nested, colors_nested),
    makeFrame(points_typed, colors_typed),
    makeFrame(points_typed_nested, colors_typed_nested)
  ].forEach(frame => {
    // Test that each "points" field is properly replaced.
    const sink = new MemorySourceSink();
    const writer = new XVIZProtobufWriter(sink);

    writer.writeMessage(0, frame);

    t.ok(sink.has('2-frame.pbe'), 'wrote binary frame');

    const data = sink.readSync('2-frame.pbe');
    const msg = new XVIZData(data).message();
    const writtenPoints = msg.data.updates[0].primitives['/test/points'].points[0];

    t.ok(writtenPoints.points, 'Has points');
    t.ok(writtenPoints.colors, 'Has colors');

    t.equals(writtenPoints.points[0], 1, 'point 1 matches input data');
    t.equals(writtenPoints.points[3], 2, 'point 2 matches input data');
    t.equals(writtenPoints.points[6], 3, 'point 3  matches input data');

    t.equals(writtenPoints.colors[0], 10, 'color 1 matches input data');
    t.equals(writtenPoints.colors[4], 20, 'color 2 matches input data');
    t.equals(writtenPoints.colors[8], 30, 'color 3 matches input data');
  });
  t.end();
});
/* eslint-enable complexity */
