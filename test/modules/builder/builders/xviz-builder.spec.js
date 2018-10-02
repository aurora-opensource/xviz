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
import {XVIZBuilder} from '@xviz/builder';

test('XVIZBuilder#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XVIZBuilder({});
  t.end();
  /* eslint-enable  no-unused-vars */
});

test('XVIZBuilder#polygon', t => {
  const builder = new XVIZBuilder();

  const verts = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];

  builder
    .pose({time: 1.0})
    .stream('/test/polygon')
    .polygon(verts)
    .style({
      color: [255, 0, 0]
    });

  const expected = {
    vehicle_pose: {time: 1.0},
    state_updates: [
      {
        timestamp: 1.0,
        primitives: {
          '/test/polygon': [
            {
              type: 'polygon',
              vertices: verts,
              color: [255, 0, 0]
            }
          ]
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder polygon matches expected output');
  t.end();
});

test('XVIZBuilder#polyline', t => {
  const builder = new XVIZBuilder({streams: {}}, [], {});

  const verts = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];

  builder
    .pose({time: 1.0})
    .stream('/test/polyline')
    .polyline(verts);

  const expected = {
    vehicle_pose: {time: 1.0},
    state_updates: [
      {
        timestamp: 1.0,
        primitives: {
          '/test/polyline': [
            {
              type: 'polyline',
              vertices: verts
            }
          ]
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder polyline matches expected output');
  t.end();
});

test('XVIZBuilder#circle', t => {
  const builder = new XVIZBuilder({streams: {}}, [], {});
  const pos = [4, 3, 0];

  builder
    .pose({time: 1.0})
    .stream('/test/circle')
    .circle(pos, 5);

  const expected = {
    vehicle_pose: {time: 1.0},
    state_updates: [
      {
        timestamp: 1.0,
        primitives: {
          '/test/circle': [
            {
              type: 'circle',
              center: pos,
              radius_m: 5
            }
          ]
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder circle matches expected output');
  t.end();
});

test('XVIZBuilder#text', t => {
  const builder = new XVIZBuilder({streams: {}}, [], {});
  const pos = [4, 3, 0];

  builder
    .pose({time: 1.0})
    .stream('/test/text')
    .text('test message')
    .position(pos);

  const expected = {
    vehicle_pose: {time: 1.0},
    state_updates: [
      {
        timestamp: 1.0,
        primitives: {
          '/test/text': [
            {
              type: 'text',
              text: 'test message',
              position: pos
            }
          ]
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder text matches expected output');
  t.end();
});

test('XVIZBuilder#stadium', t => {
  const builder = new XVIZBuilder();
  const pos = [[4, 3, 0], [8, 6, 0]];

  builder
    .pose({time: 1.0})
    .stream('/test/stadium')
    .stadium(pos[0], pos[1], 5);

  const expected = {
    vehicle_pose: {time: 1.0},
    state_updates: [
      {
        timestamp: 1.0,
        primitives: {
          '/test/stadium': [
            {
              type: 'stadium',
              start: pos[0],
              end: pos[1],
              radius_m: 5
            }
          ]
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder stadium matches expected output');
  t.end();
});

test('XVIZBuilder#variable', t => {
  const builder = new XVIZBuilder();
  const ts1 = 1.0;
  const ts2 = 2.0;

  builder
    .pose({time: ts1})
    .stream('/test/variables')
    .timestamps([ts1, ts2])
    .values([1.1, 2.0]);

  const expected = {
    vehicle_pose: {time: ts1},
    state_updates: [
      {
        timestamp: ts1,
        variables: {
          '/test/variables': {
            values: [1.1, 2.0],
            timestamps: [ts1, ts2],
            type: 'float'
          }
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder variable matches expected output');
  t.end();
});

test('XVIZBuilder#futures-single-primitive', t => {
  const builder = new XVIZBuilder();
  const streamId = '/test/polygon';
  const verts = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const ts = 1.0;

  builder
    .pose({time: ts})
    .stream(streamId)
    .polygon(verts)
    .timestamp(ts);

  const expected = {
    vehicle_pose: {time: ts},
    state_updates: [
      {
        timestamp: ts,
        futures: {
          [streamId]: {
            name: streamId,
            timestamps: [ts],
            primitives: [
              [
                {
                  type: 'polygon',
                  vertices: verts
                }
              ]
            ]
          }
        }
      }
    ]
  };

  const frame = builder.getFrame();
  t.deepEqual(frame, expected, 'XVIZBuilder single primitive futures matches expected output');
  t.end();
});

test('XVIZBuilder#time_series', t => {
  const builder = new XVIZBuilder();
  const ts = 1.0;

  builder
    .pose({time: ts})
    .stream('/test/time_series')
    .timestamp(ts)
    .value(2.0);

  const expected = {
    vehicle_pose: {time: ts},
    state_updates: [
      {
        timestamp: ts,
        variables: {
          '/test/time_series': {
            values: [2.0],
            timestamps: [ts],
            type: 'integer'
          }
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder variable matches expected output');
  t.end();
});

test('XVIZBuilder#futures-multiple-primitive', t => {
  const builder = new XVIZBuilder();
  const streamId = '/test/polygon';

  const verts1 = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const verts2 = [[1, 2, 3], [0, 0, 0], [2, 3, 4]];
  const ts1 = 1.0;
  const ts2 = 2.0;

  builder
    .pose({time: ts1})
    .stream(streamId)
    .timestamp(ts1)
    .polygon(verts1)
    .style({
      color: [255, 0, 0]
    })
    .polygon(verts2)
    .timestamp(ts2);

  const expected = {
    vehicle_pose: {time: ts1},
    state_updates: [
      {
        timestamp: ts1,
        futures: {
          [streamId]: {
            name: streamId,
            timestamps: [ts1, ts2],
            primitives: [
              [
                {
                  type: 'polygon',
                  vertices: verts1,
                  color: [255, 0, 0]
                }
              ],
              [
                {
                  type: 'polygon',
                  vertices: verts2
                }
              ]
            ]
          }
        }
      }
    ]
  };

  const frame = builder.getFrame();
  t.deepEqual(frame, expected, 'XVIZBuilder multiple primitives futures matches expected output');
  t.end();
});
