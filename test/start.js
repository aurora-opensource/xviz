/* global process */
require('@babel/register');

const {resolve} = require('path');

const mode = process.argv.length >= 3 ? process.argv[2] : 'default';
// Registers aliases for virtual packages in this module
require('source-map-support').install();

const moduleAlias = require('module-alias');
moduleAlias.addAliases({
  'test-data': resolve(__dirname, 'data'),
  xviz: mode === 'dist' ? resolve(__dirname, '../dist/es5') : resolve(__dirname, '../src')
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
