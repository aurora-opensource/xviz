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
import {setXVIZConfig} from '@xviz/parser';
import {
  parseStreamTimeSeries,
  parseStreamVariable,
  parseStreamUIPrimitives,
  parseXVIZStream
} from '@xviz/parser/parsers/parse-xviz-stream';
import {XVIZValidator} from '@xviz/schema';

import tape from 'tape-catch';

import {resetXVIZConfigAndSettings} from '../config/config-utils';

const schemaValidator = new XVIZValidator();

tape('parseStreamTimeSeries#simple', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const testData = [
    {
      timestamp: 1001,
      streams: ['/test/doubles', '/test/doubles2'],
      values: {
        doubles: [23.32, 32.23]
      }
    },
    {
      timestamp: 1002,
      streams: ['/test/int32s'],
      values: {
        int32s: [23]
      }
    },
    {
      timestamp: 1003,
      streams: ['/test/bools'],
      values: {
        bools: [false]
      }
    },
    {
      timestamp: 1004,
      streams: ['/test/strings'],
      values: {
        strings: ['test string']
      },
      object_id: '123'
    }
  ];

  const expected = {
    '/test/doubles': {
      time: 1001,
      variable: 23.32
    },
    '/test/doubles2': {
      time: 1001,
      variable: 32.23
    },
    '/test/int32s': {
      time: 1002,
      variable: 23
    },
    '/test/bools': {
      time: 1003,
      variable: false
    },
    '/test/strings': {
      time: 1004,
      variable: 'test string',
      id: '123'
    }
  };

  testData.forEach(d => schemaValidator.validate('core/timeseries_state', d));

  const result = parseStreamTimeSeries(testData, new Map());
  t.deepEquals(result, expected, 'time_series parsed properly');

  t.end();
});

tape('parseStreamVariable#simple v2', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const time = 1001;
  const testData = {
    variables: [
      {
        values: {
          doubles: [10, 11, 12]
        }
      },
      {
        values: {
          int32s: [10, 11, 12]
        }
      },
      {
        values: {
          bools: [true, false, true]
        }
      },
      {
        values: {
          strings: ['one', 'two', 'three']
        },
        base: {
          object_id: '123'
        }
      }
    ]
  };

  const expected = {
    time: 1001,
    variable: [
      {
        values: [10, 11, 12]
      },
      {
        values: [10, 11, 12]
      },
      {
        values: [true, false, true]
      },
      {
        values: ['one', 'two', 'three'],
        id: '123'
      }
    ]
  };

  schemaValidator.validate('core/variable_state', testData);

  const result = parseStreamVariable(testData, '/test', time);
  t.deepEquals(result, expected, 'variables parsed properly');

  t.end();
});

tape('parseStreamUIPrimitives#simple v2', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const time = 1001;
  const testData = {
    treetable: {
      columns: [{display_text: 'Name', type: 'string'}],
      nodes: []
    }
  };

  const expected = {
    time: 1001,
    treetable: {
      columns: [{display_text: 'Name', type: 'string'}],
      nodes: []
    }
  };

  // TODO - validate against schema

  const result = parseStreamUIPrimitives(testData, '/test', time);
  t.deepEquals(result, expected, 'variables parsed properly');

  t.end();
});

tape('parseStreamVariable#simple v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 1});

  const time = 1001;
  const testSet = [
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'string',
        values: ['Right', 'Left']
      },
      expected: {
        time: 1001,
        variable: [[1011, 'Right'], [1021, 'Left']]
      },
      name: 'string'
    },
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'bool',
        values: [true, false]
      },
      expected: {
        time: 1001,
        variable: [[1011, true], [1021, false]]
      },
      name: 'bool'
    },
    {
      xviz: {
        timestamps: [1011, 1021],
        type: 'float',
        values: [100.1, 100.2]
      },
      expected: {
        time: 1001,
        variable: [[1011, 100.1], [1021, 100.2]]
      },
      name: 'float'
    }
  ];

  testSet.forEach(testCase => {
    const result = parseStreamVariable(testCase.xviz, '/test', time);
    t.deepEquals(result, testCase.expected, `variables type ${testCase.name} parsed properly`);
  });

  t.end();
});

tape('parseXVIZStream#variable no-data entries', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 1});

  const data = [
    {
      timestamp: 100.5425,
      variables: {
        '/vehicle_intentions/stop/distance_to_object': {
          timestamps: [100.54],
          type: 'float',
          values: [-0.003]
        }
      }
    },
    {
      // A no-data entry
      timestamp: 101.84,
      futures: {'/vehicle_intentions/stop/distance_to_object': []},
      primitives: {'/vehicle_intentions/stop/distance_to_object': []},
      variables: {'/vehicle_intentions/stop/distance_to_object': []}
    }
  ];

  const expected = [
    {
      time: 100.5425,
      variable: -0.003
    },
    {
      time: 101.84
    }
  ];

  const result = parseXVIZStream(data, () => {});
  t.deepEquals(result, expected, 'Variable stream with no-data entry matches expect object');

  t.end();
});

tape('parseXVIZStream#primitive no-data entries', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 1});

  const data = [
    {
      timestamp: 100.5425,
      primitives: {
        '/object': [
          {
            type: 'polygon2d',
            vertices: [[-10, 10], [10, 10], [10, -10], [-10, -10]]
          }
        ]
      }
    },
    {
      timestamp: 101.84,
      futures: {'/object': []},
      primitives: {'/object': []},
      variables: {'/object': []}
    }
  ];

  const expected = [
    {
      lookAheads: [],
      features: [
        {
          type: 'polygon2d',
          vertices: new Float32Array([-10, 10, 0, 10, 10, 0, 10, -10, 0, -10, -10, 0, -10, 10, 0])
        }
      ],
      labels: [],
      vertices: new Float32Array([-10, 10, 0, 10, 10, 0, 10, -10, 0, -10, -10, 0, -10, 10, 0]),
      pointCloud: null,
      images: [],
      components: [],
      time: 100.5425
    },
    {
      lookAheads: [],
      features: [],
      labels: [],
      vertices: null,
      pointCloud: null,
      images: [],
      components: [],
      time: 101.84
    }
  ];

  const result = parseXVIZStream(data, () => {});
  t.deepEquals(result, expected, 'Variable stream with no-data entry matches expect object');

  t.end();
});
