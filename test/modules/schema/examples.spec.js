import {validateExampleFiles, validateInvalidFiles} from '@xviz/schema';
import test from 'tape-catch';
import * as path from 'path';

test.only('validateXVIZExamples', t => {
  // Do it by directory path first
  const schemaDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const examplesDir = path.join(schemaDir, 'examples');

  t.ok(validateExampleFiles(schemaDir, examplesDir), 'all examples match schema');

  const invalidDir = path.join(schemaDir, 'invalid');
  t.ok(validateInvalidFiles(schemaDir, invalidDir), 'all invalid examples fail');

  t.end();
});
