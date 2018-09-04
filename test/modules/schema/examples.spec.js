import {validateExampleFiles} from '@xviz/schema';
import test from 'tape-catch';
import * as path from 'path';

test('validateXVIZExamples', t => {
  // Do it by directory path first
  const schemaDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const examplesDir = path.join(schemaDir, 'examples');

  t.ok(validateExampleFiles(schemaDir, examplesDir), 'all examples match schema');

  // TODO: setup imports/exports for schema files

  t.end();
});
