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
import XVIZVariableBuilder from '@xviz/builder/builders/xviz-variable-builder';
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

test('XVIZVariableBuilder#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XVIZVariableBuilder({});
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZVariableBuilder#null getData', t => {
  const builder = new XVIZVariableBuilder({validator});
  const data = builder.stream('/test').getData();

  t.equal(data, null, 'XVIZVariableBuilder returns null if no data');
  t.end();
});

test('XVIZVariableBuilder#single entry', t => {
  const builder = new XVIZVariableBuilder({validator});
  builder.stream('/test').values([20]);

  const expected = {
    '/test': {
      variables: [
        {
          values: {doubles: [20]}
        }
      ]
    }
  };
  const data = builder.getData();

  t.deepEqual(data, expected, 'XVIZVariableBuilder single entry matches expected output');
  schemaValidator.validate('core/variable_state', data['/test']);
  t.end();
});

test('XVIZVariableBuilder#multiple entry', t => {
  const builder = new XVIZVariableBuilder({validator});
  builder.stream('/test').values([100, 200]);

  builder.stream('/foo').values([300, 400]);

  const expected = {
    '/test': {
      variables: [
        {
          values: {doubles: [100, 200]}
        }
      ]
    },
    '/foo': {
      variables: [
        {
          values: {doubles: [300, 400]}
        }
      ]
    }
  };
  const data = builder.getData();

  t.deepEqual(data, expected, 'XVIZVariableBuilder multiple entry matches expected output');
  schemaValidator.validate('core/variable_state', data['/test']);
  schemaValidator.validate('core/variable_state', data['/foo']);
  t.end();
});

test('XVIZVariableBuilder#all types and multiple entry with ids', t => {
  const builder = new XVIZVariableBuilder({validator});
  builder.stream('/test').values([1, 2, 3]);

  builder
    .stream('/test')
    .values(['a', 'b', 'c'])
    .id('1');

  builder
    .stream('/test')
    .values([true, true, false])
    .id('2');

  builder.stream('/bar').values([1.1, 1.2, 1.3]);

  const expected = {
    '/test': {
      variables: [
        {
          values: {doubles: [1, 2, 3]}
        },
        {
          base: {object_id: '1'},
          values: {strings: ['a', 'b', 'c']}
        },
        {
          base: {object_id: '2'},
          values: {bools: [true, true, false]}
        }
      ]
    },
    '/bar': {
      variables: [
        {
          values: {doubles: [1.1, 1.2, 1.3]}
        }
      ]
    }
  };

  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XVIZVariableBuilder all types and multiple entries with ids matches expected output'
  );
  schemaValidator.validate('core/variable_state', data['/test']);
  schemaValidator.validate('core/variable_state', data['/bar']);
  t.end();
});

test('XVIZVariableBuilder#throwing cases', t => {
  const builder = new XVIZVariableBuilder({validator});

  t.throws(
    () => builder.values([1]).getData(),
    /is missing/,
    'XVIZVariableBuilder throws when streamId is not provided'
  );
  builder._reset();

  builder.stream('/test');

  t.throws(
    () => builder.id('1').id('2'),
    /already set/,
    'XVIZVariableBuilder throw when trying to set id multiple times'
  );
  builder._reset();

  t.throws(
    () => builder.values('1'),
    /must be array/,
    'XVIZVariableBuilder throws when passing a non-array to values()'
  );
  builder._reset();

  t.throws(
    () => builder.id('1').getData(),
    /not provided/,
    'XVIZVariableBuilder throws when value is not provided'
  );
  builder._reset();

  t.throws(
    () => {
      builder.values(['a', 'b', 'c']).id('1');
      builder
        .stream('/test')
        .values([true, true, false])
        .id('1');
      builder.getData();
    },
    /already set for id/,
    'XVIZVariableBuilder throws when id is duplicated'
  );
  builder._reset();

  t.throws(
    () => builder.values([1]).values([2]),
    /already set/,
    'XVIZVariableBuilder throw when trying to set value multiple times'
  );
  builder._reset();

  t.end();
});
