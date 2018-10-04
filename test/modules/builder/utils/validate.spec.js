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
import {validateStreamId} from '@xviz/builder/utils';

test('validateStreamId', t => {
  const validTestCases = [
    '/vehicle-pose',
    '/tracklets/objects',
    '/tracklets/objects-1',
    '/tracklets/objects_2',
    '/tracklets/objects.3',
    '/tracklets/objects:4'
  ];

  const invalidTestCases = ['vehicle-pose', '/tracklets/objects/', '/tracklets/objects%b'];

  const validCasesResults = validTestCases.map(testCase => validateStreamId(testCase));
  const invalidCasesResults = invalidTestCases.map(testCase => validateStreamId(testCase));

  t.ok(validCasesResults.every(res => res), 'All of the cases should be valid.');
  t.ok(invalidCasesResults.every(res => !res), 'All of the cases should be invalid.');

  t.end();
});
