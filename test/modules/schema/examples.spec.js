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

import {validateExampleFiles, validateInvalidFiles} from '@xviz/schema';
import test from 'tape-catch';
import * as path from 'path';

const EXAMPLE_COUNT = 143;

test.only('validateXVIZExamples', t => {
  // Do it by directory path first
  const schemaModule = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const schemaDir = path.join(schemaModule, 'schema');
  const examplesDir = path.join(schemaModule, 'examples');

  const {invalidCount, totalCount} = validateExampleFiles(schemaDir, examplesDir);
  t.equal(invalidCount, 0, 'All examples valid');
  t.equal(totalCount, EXAMPLE_COUNT, `We found ${EXAMPLE_COUNT} examples`);

  const invalidDir = path.join(schemaDir, 'invalid');
  t.ok(validateInvalidFiles(schemaDir, invalidDir), 'all invalid examples fail');

  t.end();
});
