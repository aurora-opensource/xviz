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

import {validateExampleFiles} from '@xviz/schema';
import test from 'tape-catch';
import * as path from 'path';

test('validateExamplesFiles', t => {
  const dataDir = path.join(__dirname, 'data');
  const schemaDir = path.join(dataDir, 'schema');
  const examplesDir = path.join(dataDir, 'examples');

  const badExamples = path.join(examplesDir, 'bad');
  t.notOk(validateExampleFiles(schemaDir, badExamples), 'bad example fails');

  const goodExamples = path.join(examplesDir, 'good');
  t.ok(validateExampleFiles(schemaDir, goodExamples), 'good example passes');

  t.end();
});
