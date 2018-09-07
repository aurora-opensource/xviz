import {SDV} from '@xviz/parser';

import test from 'tape-catch';

const LOG = {
  carPosition: [10, 10, 10],
  heading: 90
};

test('SDV#methods', t => {
  const object = new SDV({vehicleLog: LOG});
  t.ok(object, 'construction ok');
  t.equal(object.isValid, true, 'getter equal');
  t.ok(object.position, 'getter ok');
  t.ok(Number.isFinite(object.bearing), 'getter ok');
  t.end();
});
