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
