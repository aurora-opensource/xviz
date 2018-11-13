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

import tape from 'tape-catch';
import {filterVertices} from '@xviz/parser/parsers/filter-vertices';
import {setXVIZSettings} from '@xviz/parser';
import PROBLEMATIC_PATH from 'test-data/meter-trajectory-duplicates';

tape('filterVertices', t => {
  setXVIZSettings({pathDistanceThreshold: 0.01});
  const path = filterVertices(PROBLEMATIC_PATH);
  setXVIZSettings({pathDistanceThreshold: 0.1});

  // Check that path has been reduced, close vertices dropped
  t.equal(path.length, 22, 'filtered length correct');

  // Check that first and last vertex are preserved
  t.deepEqual(path[0], PROBLEMATIC_PATH[0], 'filtered length correct');
  t.deepEqual(
    path[path.length - 1],
    PROBLEMATIC_PATH[PROBLEMATIC_PATH.length - 1],
    'filtered length correct'
  );

  t.end();
});
