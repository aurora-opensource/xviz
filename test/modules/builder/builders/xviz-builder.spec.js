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
  /* eslint-enable no-unused-vars */
});

test('XVIZBuilder#polygon', t => {
  const builder = new XVIZBuilder();

  const verts = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];

  builder
    .pose({time: 1.0})
    .primitive('/test/polygon')
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

  const frame = builder.getFrame();
  t.deepEqual(frame, expected, 'XVIZBuilder polygon matches expected output');
  t.end();
});

test('XVIZBuilder#single-stream-multiple-polygons', t => {
  const builder = new XVIZBuilder();

  const verts1 = [[1, 2, 3], [0, 0, 0], [2, 3, 4]];
  const verts2 = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];

  builder
    .pose({time: 1.0})
    .primitive('/test/polygon')
    .polygon(verts1)
    .style({
      color: [255, 0, 0]
    })
    .polygon(verts2)
    .style({
      color: [0, 255, 0]
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
              vertices: verts1,
              color: [255, 0, 0]
            },
            {
              type: 'polygon',
              vertices: verts2,
              color: [0, 255, 0]
            }
          ]
        }
      }
    ]
  };

  const frame = builder.getFrame();
  t.deepEqual(frame, expected, 'XVIZBuilder multiple polygon match expected output');
  t.end();
});

test('XVIZBuilder#polyline', t => {
  const builder = new XVIZBuilder({streams: {}}, [], {});

  const verts = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];

  builder
    .pose({time: 1.0})
    .primitive('/test/polyline')
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
    .primitive('/test/circle')
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
    .primitive('/test/text')
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
    .primitive('/test/stadium')
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
    .variable('/test/variables')
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

test('XVIZBuilder#multiple-variables', t => {
  const builder = new XVIZBuilder();
  const ts1 = 1.0;
  const ts2 = 2.0;

  builder
    .pose({time: ts1})
    .variable('/test/variables_1')
    .timestamps([ts1, ts2])
    .values([1.1, 2.0]);

  builder
    .variable('/test/variables_2')
    .timestamps([ts2, ts1])
    .values([2.0, 1.1]);

  const expected = {
    vehicle_pose: {time: ts1},
    state_updates: [
      {
        timestamp: ts1,
        variables: {
          '/test/variables_1': {
            values: [1.1, 2.0],
            timestamps: [ts1, ts2],
            type: 'float'
          },
          '/test/variables_2': {
            values: [2.0, 1.1],
            timestamps: [ts2, ts1],
            type: 'float'
          }
        }
      }
    ]
  };

  t.deepEqual(builder.getFrame(), expected, 'XVIZBuilder multiple variables match expected output');
  t.end();
});

test('XVIZBuilder#time_series', t => {
  const builder = new XVIZBuilder();
  const ts1 = 1.0;
  const ts2 = 1.0;

  builder
    .pose({time: ts1})
    .timeSeries('/test/time_series_1')
    .timestamp(ts1)
    .value(1.0);

  builder
    .timeSeries('/test/time_series_2')
    .timestamp(ts2)
    .value(2.0);

  const expected = {
    vehicle_pose: {time: ts1},
    state_updates: [
      {
        timestamp: ts1,
        variables: {
          '/test/time_series_1': {
            values: [1.0],
            timestamps: [ts1],
            type: 'integer'
          },
          '/test/time_series_2': {
            values: [2.0],
            timestamps: [ts2],
            type: 'integer'
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
    .primitive(streamId)
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

test('XVIZBuilder#futures-multiple-primitive', t => {
  const builder = new XVIZBuilder();
  const streamId = '/test/polygon';

  const verts1 = [[1, 2, 3], [0, 0, 0], [2, 3, 4]];
  const verts2 = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
  const ts1 = 2.0;
  const ts2 = 1.0;

  builder
    .pose({time: ts2})
    .primitive(streamId)
    .timestamp(ts1)
    .polygon(verts1)
    .style({
      color: [255, 0, 0]
    })
    .polygon(verts2)
    .timestamp(ts2);

  const expected = {
    vehicle_pose: {time: ts2},
    state_updates: [
      {
        timestamp: ts2,
        futures: {
          [streamId]: {
            name: streamId,
            timestamps: [ts2, ts1],
            primitives: [
              [
                {
                  type: 'polygon',
                  vertices: verts2
                }
              ],
              [
                {
                  type: 'polygon',
                  vertices: verts1,
                  color: [255, 0, 0]
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
