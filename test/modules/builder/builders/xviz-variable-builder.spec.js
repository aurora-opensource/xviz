/* eslint-disable camelcase */
import test from 'tape-catch';
import XvizVariableBuilder from '@xviz/builder/builders/xviz-variable-builder';
import XVIZValidator from '@xviz/builder/builders/xviz-validator';

const validator = new XVIZValidator({
  validateWarn: msg => {
    throw new Error(msg);
  },
  validateError: msg => {
    throw new Error(msg);
  }
});

test('XvizVariableBuilder#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XvizVariableBuilder({});
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XvizVariableBuilder#null getData', t => {
  const builder = new XvizVariableBuilder({validator});
  const data = builder.stream('/test').getData();

  t.equal(data, null, 'XvizVariableBuilder returns null if no data');
  t.end();
});

test('XvizVariableBuilder#single entry', t => {
  const builder = new XvizVariableBuilder({validator});
  builder.stream('/test').values([20]);

  const expected = {
    '/test': {
      variables: [
        {
          values: [20]
        }
      ]
    }
  };
  const data = builder.getData();

  t.deepEqual(data, expected, 'XvizVariableBuilder single entry matches expected output');
  t.end();
});

test('XvizVariableBuilder#multiple entry', t => {
  const builder = new XvizVariableBuilder({validator});
  builder.stream('/test').values([100, 200]);

  builder.stream('/foo').values([300, 400]);

  const expected = {
    '/test': {
      variables: [
        {
          values: [100, 200]
        }
      ]
    },
    '/foo': {
      variables: [
        {
          values: [300, 400]
        }
      ]
    }
  };
  const data = builder.getData();

  t.deepEqual(data, expected, 'XvizVariableBuilder multiple entry matches expected output');
  t.end();
});

test('XvizVariableBuilder#all types and multiple entry with ids', t => {
  const builder = new XvizVariableBuilder({validator});
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
          values: [1, 2, 3]
        },
        {
          values: ['a', 'b', 'c'],
          object_id: '1'
        },
        {
          values: [true, true, false],
          object_id: '2'
        }
      ]
    },
    '/bar': {
      variables: [
        {
          values: [1.1, 1.2, 1.3]
        }
      ]
    }
  };

  const data = builder.getData();

  t.deepEqual(
    data,
    expected,
    'XvizVariableBuilder all types and multiple entries with ids matches expected output'
  );
  t.end();
});

test('XvizVariableBuilder#throwing cases', t => {
  const builder = new XvizVariableBuilder({validator});

  t.throws(
    () => builder.values([1]).getData(),
    /is missing/,
    'XvizVariableBuilder throws when streamId is not provided'
  );
  builder._reset();

  builder.stream('/test');

  t.throws(
    () => builder.id('1').id('2'),
    /already set/,
    'XvizVariableBuilder throw when trying to set id multiple times'
  );
  builder._reset();

  t.throws(
    () => builder.values('1'),
    /must be array/,
    'XvizVariableBuilder throws when passing a non-array to values()'
  );
  builder._reset();

  t.throws(
    () => builder.id('1').getData(),
    /not provided/,
    'XvizVariableBuilder throws when value is not provided'
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
    'XvizVariableBuilder throws when id is duplicated'
  );
  builder._reset();

  t.throws(
    () => builder.values([1]).values([2]),
    /already set/,
    'XvizVariableBuilder throw when trying to set value multiple times'
  );
  builder._reset();

  t.end();
});
