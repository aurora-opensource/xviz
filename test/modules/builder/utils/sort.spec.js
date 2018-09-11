import test from 'tape-catch';
import {insertTimestamp} from '@xviz/builder/utils';

test('insertTimestamps', t => {
  const timestamps = [1, 2, 5];
  const values = ['a1', 'b2', 'c5'];
  const ts = 3;
  const value = 'd3';

  insertTimestamp(timestamps, values, ts, value);

  t.deepEqual(timestamps, [1, 2, 3, 5], 'timestamps match expected output');
  t.deepEqual(values, ['a1', 'b2', 'd3', 'c5'], 'timestamps match expected output');
  t.end();
});
