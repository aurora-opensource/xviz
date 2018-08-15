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

import {XvizObject} from '@xviz/parser';

import {} from '@xviz/parser';

import test from 'tape-catch';

test('XvizObject#static methods', t => {
  t.ok(typeof XvizObject.get, 'function', 'get is exposed');
  t.ok(typeof XvizObject.clear, 'function', 'clear is exposed');
  t.ok(typeof XvizObject.resetAll, 'function', 'resetAll is exposed');
  t.ok(typeof XvizObject.getAll, 'function', 'getAll is exposed');
  t.ok(typeof XvizObject.getAllInCurrentFrame, 'function', 'getAllInCurrentFrame is exposed');
  t.end();
});

test('XvizObject#constructor', t => {
  const object = new XvizObject({id: 11, index: 0, timestamp: 1000});
  t.ok(object, 'creates OBJECT object successfully');
  t.is(object.id, 11, 'OBJECT object id is correct');
  t.ok(object.state, 'creates state object');
  t.ok(object.props, 'creates props object');
  t.is(object.startTime, 1000, 'has startTime');
  t.is(object.endTime, 1000, 'has endTime');
  t.end();
});

test('XvizObject#observe', t => {
  const object = new XvizObject({id: 11, index: 0, timestamp: 1000});

  object._observe(1001);
  t.is(object.startTime, 1000, 'has correct startTime');
  t.is(object.endTime, 1001, 'has correct endTime');

  object._observe(999);
  t.is(object.startTime, 999, 'has correct startTime');
  t.is(object.endTime, 1001, 'has correct endTime');

  t.end();
});

test('XvizObject#_reset, _setTrackingPoint, isValid', t => {
  const object = new XvizObject({id: 11, index: 0, timestamp: 1000});

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
