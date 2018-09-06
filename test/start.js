const {resolve} = require('path');

/* global process */
require('@babel/register')({
  configFile: resolve(__dirname, '../babel.config.js')
});

const {BrowserTestDriver} = require('probe.gl/test-utils');

const mode = process.argv.length >= 3 ? process.argv[2] : 'default';

require('source-map-support').install();

// Registers aliases for virtual packages in this module
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
  case 'test':
  case 'src':
  case 'dist':
    require('./index');
    break;

  case 'bench':
    require('./bench');
    break;

  case 'browser':
    new BrowserTestDriver().run({
      process: 'webpack-dev-server',
      parameters: ['--config', 'test/webpack.config.js', '--env.testBrowser'],
      exposeFunction: 'testDone'
    });
    break;

  default:
    require('./index');
    break;
}
