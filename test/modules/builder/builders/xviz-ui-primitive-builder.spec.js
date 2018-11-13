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
import XVIZUIPrimitiveBuilder from '@xviz/builder/builders/xviz-ui-primitive-builder';
import {default as XVIZBuilderValidator} from '@xviz/builder/builders/xviz-validator';
// import {XVIZValidator} from '@xviz/schema';

// const schemaValidator = new XVIZValidator();

const validator = new XVIZBuilderValidator({
  validateWarn: msg => {
    throw new Error(msg);
  },
  validateError: msg => {
    throw new Error(msg);
  }
});

const TEST_COLUMNS = [{display_text: 'Name', type: 'string'}];

test('XVIZUIPrimitiveBuilder#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XVIZUIPrimitiveBuilder({});
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZUIPrimitiveBuilder#null getData', t => {
  const builder = new XVIZUIPrimitiveBuilder({validator});
  const data = builder.stream('/test').getData();

  t.equal(data, null, 'XVIZUIPrimitiveBuilder returns null if no data');
  t.end();
});

test('XVIZUIPrimitiveBuilder#treetable', t => {
  let builder = new XVIZUIPrimitiveBuilder({validator});
  builder.stream('/test').treetable(TEST_COLUMNS);
  t.deepEquals(
    builder.getData(),
    {
      '/test': {
        treetable: {
          columns: TEST_COLUMNS,
          nodes: []
        }
      }
    },
    'XVIZUIPrimitiveBuilder returns correct data'
  );

  builder = new XVIZUIPrimitiveBuilder({validator});
  t.throws(
    () => {
      builder.stream('/test').row(0, ['row0']);
      return builder.getData();
    },
    /columns/i,
    'XVIZUIPrimitiveBuilder should throw if columns are not defined'
  );

  builder = new XVIZUIPrimitiveBuilder({validator});
  let row = builder
    .stream('/test')
    .treetable(TEST_COLUMNS)
    .row(0, ['row0']);
  row.child(1, ['row1']);
  row = builder.row(2, null);
  row.child(3, ['row3']);

  t.deepEquals(
    builder.getData(),
    {
      '/test': {
        treetable: {
          columns: TEST_COLUMNS,
          nodes: [
            {id: 0, column_values: ['row0']},
            {id: 1, parent: 0, column_values: ['row1']},
            {id: 2},
            {id: 3, parent: 2, column_values: ['row3']}
          ]
        }
      }
    },
    'XVIZUIPrimitiveBuilder returns correct data'
  );

  t.end();
});
