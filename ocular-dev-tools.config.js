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

module.exports = {
  lint: {
    paths: ['modules', 'dev_docs', 'docs', 'test', 'examples'],
    extensions: ['js', 'md']
  },

  aliases: {
    // TEST
    'test-data': resolve(__dirname, 'test/data'),

    '@xviz/conformance': resolve(__dirname, 'modules/conformance'),
    '@xviz/schema/dist': resolve(__dirname, 'modules/schema/dist')
  },

  browserTest: {
    browser: {
      // Required by CI
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  },

  entry: {
    test: 'test/index.js',
    'test-browser': 'test/browser.js',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/browser.js',
    size: 'test/size/import-nothing.js'
  }
};
