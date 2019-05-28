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

function flattenArray(array) {
  return array.reduce((arr, entry) => arr.concat(entry), []);
}

test('XVIZBuilder#points', t => {
  // We just need to generate nested array data for the test
  const makeRandomPoints = (count, size) =>
    Array(count)
      .fill()
      .map(() =>
        Array(size)
          .fill()
          .map(() => Math.round(Math.random() * 255))
      );

  // Must have minimum of 20 elements to be converted to binary
  const points_nested = makeRandomPoints(20, 3);
  const colors_nested = makeRandomPoints(20, 4);

  const points_flat = flattenArray(points_nested);
  const colors_flat = flattenArray(colors_nested);

  const points_typed = Float32Array.from(points_flat);
  const colors_typed = Uint8Array.from(colors_flat);

  // Generate a frame with specific points and colors
  [
    makeFrame(points_flat, colors_flat),
    makeFrame(points_nested, colors_nested),
    makeFrame(points_typed, colors_typed)
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

test('XVIZBuilder#points not made binary because too few elements', t => {
  // Must have minimum of 20 elements to be converted to binary
  const points_flat = [0, 0, 0, 4, 0, 0, 4, 3, 0];
  const colors_flat = [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255];

  const points_nested = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const colors_nested = [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]];

  // Generate a frame with specific points and colors
  [makeFrame(points_flat, colors_flat), makeFrame(points_nested, colors_nested)].forEach(frame => {
    // Test that each "points" field is properly replaced.
    const sink = new MemorySink();
    const writer = new XVIZWriter({dataSink: sink, envelope: true, binary: true});

    writer.writeFrame('test', 0, frame);

    t.ok(sink.has('test', '2-frame.glb'), 'wrote binary frame');

    // TODO: once this is merged into @xviz/io replace this with actual
    // parsing and validation of the structure.
    const data = sink.get('test', '2-frame.glb');
    t.notOk(data.toString().includes('#/accessors/0'), 'data has accessor 0');
    t.notOk(data.toString().includes('#/accessors/1'), 'data has accessor 1');
  });
  t.end();
});
