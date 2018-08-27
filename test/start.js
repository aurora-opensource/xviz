/* global process */
require('@babel/register')({
  presets: [['@babel/env', {modules: 'commonjs'}]]
});

const {resolve} = require('path');

const mode = process.argv.length >= 3 ? process.argv[2] : 'default';
// Registers aliases for virtual packages in this module
require('source-map-support').install();

const moduleAlias = require('module-alias');
moduleAlias.addAliases({
  'test-data': resolve(__dirname, 'data'),
  '@xviz/builder':
    mode === 'dist'
      ? resolve(__dirname, '../modules/builder/dist/es5')
      : resolve(__dirname, '../modules/builder/src'),
  '@xviz/parser':
    mode === 'dist'
      ? resolve(__dirname, '../modules/parser/dist/es5')
      : resolve(__dirname, '../modules/parser/src'),
  '@xviz/schema':
    mode === 'dist'
      ? resolve(__dirname, '../modules/schema/dist/es5')
      : resolve(__dirname, '../modules/schema/src')
});

switch (mode) {
  case 'bench':
    require('./bench');
    break;

  case 'test':
  case 'dist':
  default:
    require('./index');
    break;
}
