import {XVIZObject} from '@xviz/parser';

import test from 'tape-catch';

test('XVIZObject#static methods', t => {
  t.ok(typeof XVIZObject.get, 'function', 'get is exposed');
  t.ok(typeof XVIZObject.clear, 'function', 'clear is exposed');
  t.ok(typeof XVIZObject.resetAll, 'function', 'resetAll is exposed');
  t.ok(typeof XVIZObject.getAll, 'function', 'getAll is exposed');
  t.ok(typeof XVIZObject.getAllInCurrentFrame, 'function', 'getAllInCurrentFrame is exposed');
  t.end();
});

test('XVIZObject#constructor', t => {
  const object = new XVIZObject({id: 11, index: 0, timestamp: 1000});
  t.ok(object, 'creates OBJECT object successfully');
  t.is(object.id, 11, 'OBJECT object id is correct');
  t.ok(object.state, 'creates state object');
  t.ok(object.props, 'creates props object');
  t.is(object.startTime, 1000, 'has startTime');
  t.is(object.endTime, 1000, 'has endTime');
  t.end();
});

test('XVIZObject#observe', t => {
  const object = new XVIZObject({id: 11, index: 0, timestamp: 1000});

  object._observe(1001);
  t.is(object.startTime, 1000, 'has correct startTime');
  t.is(object.endTime, 1001, 'has correct endTime');

  object._observe(999);
  t.is(object.startTime, 999, 'has correct startTime');
  t.is(object.endTime, 1001, 'has correct endTime');

  t.end();
});

test('XVIZObject#_reset, _setTrackingPoint, isValid', t => {
  const object = new XVIZObject({id: 11, index: 0, timestamp: 1000});

  t.not(object.isValid, 'object should be empty');

  object._setTrackingPoint([0, 1]);
  t.deepEquals(
    object.props.get('trackingPoint'),
    [0, 1, 0],
    'sets trackingPoint from single point'
  );
  t.ok(object.isValid, 'object should not be empty');

  object._reset();
  t.not(object.isValid, 'object should be empty');
  object._setTrackingPoint([[0, 1]]);
  t.deepEquals(object.props.get('trackingPoint'), [0, 1, 0], 'sets trackingPoint from multi point');
  t.ok(object.isValid, 'object should not be empty');

  t.end();
});
