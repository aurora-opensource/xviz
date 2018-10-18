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

import {loadValidator} from '@xviz/schema';
import {SCHEMA_DATA} from '@xviz/schema';

import test from 'tape-catch';
import * as path from 'path';

test('schemaDataContents', t => {
  const schemaDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const ajv = loadValidator(schemaDir);

  // Check that every core schema is in the in the data list
  for (const key in ajv._schemas) {
    if (!key.startsWith('http://json-schema.org')) {
      t.ok(
        key in SCHEMA_DATA,
        `${key} schema content in present in data "(fix with node genimports.js)"`
      );
    }
  }

  // Check that we don't have any extra data
  for (const key in SCHEMA_DATA) {
    t.ok(key in ajv._schemas, `${key} data present in schema (fix with "node genimports.js")`);
  }

  t.ok(Object.keys(SCHEMA_DATA).length > 0, 'we have schemas');

  t.end();
});
