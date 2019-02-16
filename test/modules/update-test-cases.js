const path = require('path');
const {loadAllFiles, dump} = require('../../modules/schema/scripts/file-utils');

function getSchemaExamples() {
  const moduleDir = path.resolve(__dirname, '../../modules/schema');
  const examplesMap = loadAllFiles(path.resolve(moduleDir, 'examples/'), '.json');
  const invalidExamplesMap = loadAllFiles(path.resolve(moduleDir, 'invalid/'), '.json');
  dump(
    {
      'Auto-Generated by modules/schema build command - DO NOT EDIT': true,
      examples: Object.keys(examplesMap),
      invalid: Object.keys(invalidExamplesMap)
    },
    path.resolve(__dirname, './schema/examples.json')
  );
}

getSchemaExamples();
