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

import test from 'tape-catch';

import {XvizObject, XvizObjectCollection} from '@xviz/parser';

/* set default collection */
XvizObject.setDefaultCollection(new XvizObjectCollection());

test('XvizObjectCollection#observe, get, getAll', t => {
  const collection = new XvizObjectCollection();

  const object0 = collection.get('A');
  t.notOk(object0, 'should not return Xviz object');

  collection.observe('A', 1000);
  const object1 = collection.get('A');
  t.ok(object1 instanceof XvizObject, 'gets Xviz object');
  t.is(object1.id, 'A', 'Xviz object id is correct');

  collection.observe('A', 1001);
  const object11 = collection.get('A');
  t.is(object1, object11, 'gets the same Xviz object');

  collection.observe('B', 1001);
  const object2 = collection.get('B');
  t.not(object1, object2, 'gets different Xviz object');

  const objects = collection.getAll();
  t.comment(objects);
  t.deepEquals(objects, {A: object1, B: object2}, 'returns all Xviz objects');

  t.end();
});

test('XvizObjectCollection#resetAll, getAllInCurrentFrame', t => {
  const collection = new XvizObjectCollection();

  collection.observe('A', 1000);
  collection.observe('B', 1000);

  const object1 = collection.get('A');
  const object2 = collection.get('B');

  object1._setTrackingPoint([0, 1]);
  t.deepEquals(
    collection.getAllInCurrentFrame(),
    {A: object1},
    'returns all Xviz objects in current frame'
  );

  collection.resetAll();
  t.deepEquals(collection.getAllInCurrentFrame(), {}, 'returns all Xviz objects in current frame');

  object2._setTrackingPoint([0, 1]);
  t.deepEquals(
    collection.getAllInCurrentFrame(),
    {B: object2},
    'returns all Xviz objects in current frame'
  );

  t.end();
});

test('XvizObjectCollection#prune', t => {
  const collection = new XvizObjectCollection();

  collection.observe('A', 1000);
  collection.observe('B', 1001);
  collection.observe('C', 1002);

  collection.prune(1001, 1003);
  t.is(collection.objects.size, 2, 'has correct number of objects');
  const objects = collection.getAll();
  t.deepEquals(Object.keys(objects), ['B', 'C'], 'dropped the correct object');

  t.end();
});
