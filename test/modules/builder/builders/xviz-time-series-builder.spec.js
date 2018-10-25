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
import XVIZTimeSeriesBuilder from '@xviz/builder/builders/xviz-time-series-builder';
import {default as XVIZBuilderValidator} from '@xviz/builder/builders/xviz-validator';
import {XVIZValidator} from '@xviz/schema';

const schemaValidator = new XVIZValidator();

const validator = new XVIZBuilderValidator({
  validateWarn: msg => {
    throw new Error(msg);
  },
  validateError: msg => {
    throw new Error(msg);
  }
});

test('XVIZTimeSeriesBuilder#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XVIZTimeSeriesBuilder({});
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZTimeSeriesBuilder#null getData', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  const data = builder.stream('/test').getData();

  t.equal(data, null, 'XVIZTimeSeriesBuilder returns null if no data');
  t.end();
});

test('XVIZTimeSeriesBuilder#single entry', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1);

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1]]
    }
  ];
  const data = builder.getData();

  t.deepEqual(data, expected, 'XVIZTimeSeriesBuilder single entry matches expected output');
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});

test('XVIZTimeSeriesBuilder#multiple entry same ts', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1);

  builder
    .stream('/foo')
    .timestamp(20)
    .value(2);

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1], ['/foo', 2]]
    }
  ];
  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZTimeSeriesBuilder multiple entry same ts matches expected output'
  );
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});

test('XVIZTimeSeriesBuilder#multiple entry different ts', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1);

  builder
    .stream('/foo')
    .timestamp(30)
    .value(2);

  builder
    .stream('/bar')
    .timestamp(20)
    .value(3);

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1], ['/bar', 3]]
    },
    {
      timestamp: 30,
      values: [['/foo', 2]]
    }
  ];
  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZTimeSeriesBuilder multiple entry different ts matches expected output'
  );
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});

test('XVIZTimeSeriesBuilder#all types with id', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/int')
    .timestamp(20)
    .value(1)
    .id('1');

  builder
    .stream('/string')
    .timestamp(20)
    .value('good')
    .id('2');

  builder
    .stream('/number')
    .timestamp(20)
    .value(100.1)
    .id('3');

  builder
    .stream('/bool')
    .timestamp(20)
    .value(false)
    .id('4');

  const expected = [
    {
      timestamp: 20,
      values: [['/int', 1]],
      object_id: '1'
    },
    {
      timestamp: 20,
      values: [['/string', 'good']],
      object_id: '2'
    },
    {
      timestamp: 20,
      values: [['/number', 100.1]],
      object_id: '3'
    },
    {
      timestamp: 20,
      values: [['/bool', false]],
      object_id: '4'
    }
  ];
  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZTimeSeriesBuilder multiple entry different ts matches expected output'
  );
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});

test('XVIZTimeSeriesBuilder#throwing cases', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});

  t.throws(
    () => builder.value('1').getData(),
    /is missing/,
    'XVIZTimeSeriesBuilder throws when streamId is not provided'
  );
  builder._reset();

  builder.stream('/test');

  t.throws(
    () => builder.id('1').id('2'),
    /already set/,
    'XVIZTimeSeriesBuilder throw when trying to set id multiple times'
  );
  builder._reset();

  t.throws(
    () => builder.timestamp(1).timestamp(1),
    /already set/,
    'XVIZTimeSeriesBuilder throw when trying to set timestamp multiple times'
  );
  builder._reset();

  t.throws(
    () => builder.value('1').value('2'),
    /already set/,
    'XVIZTimeSeriesBuilder throw when trying to set value multiple times'
  );
  builder._reset();

  t.throws(
    () => builder.timestamp(['1']),
    /single value/,
    'XVIZTimeSeriesBuilder throws when passing an array to timestamp()'
  );
  builder._reset();

  t.throws(
    () => builder.value(['1']),
    /single value/,
    'XVIZTimeSeriesBuilder throws when passing an array to value()'
  );
  builder._reset();

  t.throws(
    () => builder.value('1').getData(),
    /not provided/,
    'XVIZTimeSeriesBuilder throws when timestamp is not provided'
  );
  builder._reset();

  t.throws(
    () =>
      builder
        .stream('/test')
        .timestamp(1)
        .getData(),
    /not provided/,
    'XVIZTimeSeriesBuilder throws when value is not provided'
  );
  builder._reset();

  t.end();
});

test('XVIZTimeSeriesBuilder#single entry id', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1)
    .id('123');

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1]],
      object_id: '123'
    }
  ];
  const data = builder.getData();

  t.deepEqual(data, expected, 'XVIZTimeSeriesBuilder single entry id matches expected output');
  t.end();
});

test('XVIZTimeSeriesBuilder#multiple entry id same ts', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1)
    .id('123');

  builder
    .stream('/foo')
    .timestamp(20)
    .value(2)
    .id('123');

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1], ['/foo', 2]],
      object_id: '123'
    }
  ];
  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZTimeSeriesBuilder multiple entry id same ts matches expected output'
  );
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});

test('XVIZTimeSeriesBuilder#multiple entry different id ts', t => {
  const builder = new XVIZTimeSeriesBuilder({validator});
  builder
    .stream('/test')
    .timestamp(20)
    .value(1)
    .id('123');

  builder
    .stream('/foo')
    .timestamp(30)
    .value(2)
    .id('123');

  builder
    .stream('/bar')
    .timestamp(20)
    .value(3)
    .id('987');

  const expected = [
    {
      timestamp: 20,
      values: [['/test', 1]],
      object_id: '123'
    },
    {
      timestamp: 20,
      values: [['/bar', 3]],
      object_id: '987'
    },
    {
      timestamp: 30,
      values: [['/foo', 2]],
      object_id: '123'
    }
  ];
  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZTimeSeriesBuilder multiple entry different ts matches expected output'
  );
  data.forEach(d => schemaValidator.validate('core/timeseries_state', d));
  t.end();
});
