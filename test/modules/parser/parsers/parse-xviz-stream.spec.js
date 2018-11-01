/* eslint-disable camelcase */
import {setXvizSettings} from '@xviz/parser';
import {parseStreamTimeSeries} from '@xviz/parser/parsers/parse-xviz-stream';
import {XVIZValidator} from '@xviz/schema';

import tape from 'tape-catch';

const schemaValidator = new XVIZValidator();

tape('parseStreamTimeSeries#simple', t => {
  setXvizSettings({currentMajorVersion: 2});

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
