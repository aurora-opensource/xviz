/* eslint-disable camelcase */
import {setXvizSettings} from '@xviz/parser';
import {parseStreamTimeSeries} from '@xviz/parser/parsers/parse-xviz-stream';

import tape from 'tape-catch';

tape('parseStreamTimeSeries#simple', t => {
  setXvizSettings({currentMajorVersion: 2});

  const testData = [
    {
      timestamp: 1001,
      streams: ['/test/doubles'],
      values: {
        doubles: [23.32]
      }
    },
    {
      timestamp: 1002,
      streams: ['/test/int32s'],
      values: {
        doubles: [23]
      }
    },
    {
      timestamp: 1003,
      streams: ['/test/bools'],
      values: {
        doubles: [false]
      }
    },
    {
      timestamp: 1004,
      streams: ['/test/strings'],
      values: {
        doubles: ['test string']
      },
      object_id: '123'
    }
  ];

  const expected = {
    '/test/doubles': {
      time: 1001,
      variable: 23.32
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

  const result = parseStreamTimeSeries(testData, new Map());
  t.deepEquals(result, expected, 'time_series parsed properly');

  t.end();
});
