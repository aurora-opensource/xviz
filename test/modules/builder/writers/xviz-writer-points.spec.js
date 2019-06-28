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
import {XVIZWriter} from '@xviz/builder';

class MemorySink {
  constructor() {
    this.data = new Map();
  }

  _key(scope, name) {
    return `${scope}/${name}`;
  }

  writeSync(scope, name, data) {
    const key = this._key(scope, name);
    this.data.set(key, data);
  }

  has(scope, name) {
    return this.data.has(this._key(scope, name));
  }

  get(scope, name) {
    return this.data.get(this._key(scope, name));
  }
}

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

test('XVIZBuilder#points binary', t => {
  const points_flat = [0, 0, 0, 4, 0, 0, 4, 3, 0];
  const colors_flat = [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255];

  const points_nested = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const colors_nested = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]];

  const points_typed = Float32Array.from([0, 0, 0, 4, 0, 0, 4, 3, 0]);
  const colors_typed = Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

  const points_typed_nested = [
    Float32Array.from([0, 0, 0]),
    Float32Array.from([4, 0, 0]),
    Float32Array.from([4, 3, 0])
  ];
  const colors_typed_nested = [
    Uint8Array.from([255, 0, 0, 255]),
    Uint8Array.from([0, 255, 0, 255]),
    Uint8Array.from([0, 0, 255, 255])
  ];

  // Generate a frame with specific points and colors
  [
    makeFrame(points_flat, colors_flat),
    makeFrame(points_nested, colors_nested),
    makeFrame(points_typed, colors_typed),
    makeFrame(points_typed_nested, colors_typed_nested)
  ].forEach(frame => {
    // Test that each "points" field is properly replaced.
    const sink = new MemorySink();
    const writer = new XVIZWriter({dataSink: sink, envelope: true, binary: true});

    writer.writeFrame('test', 0, frame);

    t.ok(sink.has('test', '2-frame.glb'), 'wrote binary frame');

    // TODO: once this is merged into @xviz/io replace this with actual
    // parsing and validation of the structure.
    const data = sink.get('test', '2-frame.glb');
    t.ok(data.toString().includes('#/accessors/0'), 'data has accessor 0');
    t.ok(data.toString().includes('#/accessors/1'), 'data has accessor 1');
  });
  t.end();
});

test('XVIZBuilder#points json', t => {
  const points_flat = [0, 0, 0, 4, 0, 0, 4, 3, 0];
  const colors_flat = [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255];

  const points_nested = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const colors_nested = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]];

  const points_typed = Float32Array.from([0, 0, 0, 4, 0, 0, 4, 3, 0]);
  const colors_typed = Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);

  const points_typed_nested = [
    Float32Array.from([0, 0, 0]),
    Float32Array.from([4, 0, 0]),
    Float32Array.from([4, 3, 0])
  ];
  const colors_typed_nested = Uint8Array.from([10, 10, 10, 255, 20, 20, 20, 255, 30, 30, 30, 255]);
  // TODO(twojtasz): Should be this, but We don't know how to handle this case as colors could have 3 or 4 elements
  /*
  const colors_typed_nested = [
    Uint8Array.from([255, 0, 0, 255]),
    Uint8Array.from([0, 255, 0, 255]),
    Uint8Array.from([0, 0, 255, 255])
  ];
  */

  // Generate a frame with specific points and colors
  [
    makeFrame(points_flat, colors_flat),
    makeFrame(points_nested, colors_nested),
    makeFrame(points_typed, colors_typed),
    makeFrame(points_typed_nested, colors_typed_nested)
  ].forEach(frame => {
    // Test that each "points" field is properly replaced.
    const sink = new MemorySink();
    const writer = new XVIZWriter({dataSink: sink, envelope: true, binary: false, json: true});

    writer.writeFrame('test', 0, frame);

    t.ok(sink.has('test', '2-frame.json'), 'wrote json frame');

    // TODO: once this is merged into @xviz/io replace this with actual
    // parsing and validation of the structure.
    const data = sink.get('test', '2-frame.json');
    const msg = JSON.parse(data);
    const points = msg.data.updates[0].primitives['/test/points'].points[0].points;
    if (points.length === 9) {
      t.ok(Number.isFinite(points[0]), 'Flat array has Number @ index 0');
    } else if (points.length === 3) {
      t.ok(Array.isArray(points[0]), 'Nested array has Array @ index 0');
      t.equals(points[0].length, 3, 'Nested array @ index 0 has 3');
    } else {
      t.fail('Points has an unexpected number of entries');
    }
  });
  t.end();
});
