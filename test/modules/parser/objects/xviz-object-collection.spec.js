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

import {XVIZObject, XVIZObjectCollection} from '@xviz/parser';

/* set default collection */
XVIZObject.setDefaultCollection(new XVIZObjectCollection());

test('XVIZObjectCollection#observe, get, getAll', t => {
  const collection = new XVIZObjectCollection();

  const object0 = collection.get('A');
  t.notOk(object0, 'should not return XVIZ object');

  collection.observe('A', 1000);
  const object1 = collection.get('A');
  t.ok(object1 instanceof XVIZObject, 'gets XVIZ object');
  t.is(object1.id, 'A', 'XVIZ object id is correct');

  collection.observe('A', 1001);
  const object11 = collection.get('A');
  t.is(object1, object11, 'gets the same XVIZ object');

  collection.observe('B', 1001);
  const object2 = collection.get('B');
  t.not(object1, object2, 'gets different XVIZ object');

  const objects = collection.getAll();
  t.comment(objects);
  t.deepEquals(objects, {A: object1, B: object2}, 'returns all XVIZ objects');

  t.end();
});

test('XVIZObjectCollection#resetAll, getAllInCurrentFrame', t => {
  const collection = new XVIZObjectCollection();

  collection.observe('A', 1000);
  collection.observe('B', 1000);

  const object1 = collection.get('A');
  const object2 = collection.get('B');

  object1._setTrackingPoint([0, 1]);
  t.deepEquals(
    collection.getAllInCurrentFrame(),
    {A: object1},
    'returns all XVIZ objects in current frame'
  );

  collection.resetAll();
  t.deepEquals(collection.getAllInCurrentFrame(), {}, 'returns all XVIZ objects in current frame');

  object2._setTrackingPoint([0, 1]);
  t.deepEquals(
    collection.getAllInCurrentFrame(),
    {B: object2},
    'returns all XVIZ objects in current frame'
  );

  t.end();
});

test('XVIZObjectCollection#prune', t => {
  const collection = new XVIZObjectCollection();

  collection.observe('A', 1000);
  collection.observe('B', 1001);
  collection.observe('C', 1002);

  collection.prune(1001, 1003);
  t.is(collection.objects.size, 2, 'has correct number of objects');
  const objects = collection.getAll();
  t.deepEquals(Object.keys(objects), ['B', 'C'], 'dropped the correct object');

  t.end();
});
