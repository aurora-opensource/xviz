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
