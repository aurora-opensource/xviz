import {BaseObject} from '@xviz/parser';

import test from 'tape-catch';

test('BaseObject#methods', t => {
  const object = new BaseObject();
  t.ok(object, 'construction ok');
  t.equal(object.isValid, false, 'getter equal');
  t.equal(object.position, null, 'getter ok');
  t.equal(object.bearing, null, 'getter ok');
  t.end();
});
