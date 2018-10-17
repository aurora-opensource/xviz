import {validateExampleFiles, loadValidator} from '@xviz/schema';
import {SCHEMA_DATA} from '@xviz/schema';

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
