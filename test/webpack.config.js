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

// Webpack 2 configuration file for running tests in browser
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {resolve} = require('path');
const ALIASES = require('../aliases');

const TEST_DIR = './test';

const CONFIG = {
  mode: 'development',

  devServer: {
    stats: {
      warnings: false
    },
    contentBase: [resolve(TEST_DIR, '..')],
    progress: true
  },

  devtool: '#inline-source-maps',

  resolve: {
    // Adding `esnext` imports untranspiled source, easier for debugging
    // mainFields: ['esnext', 'browser', 'module', 'main'],
    alias: ALIASES
  },

  module: {
    rules: [
      {
        // Compile ES2015 using buble
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        ]
      }
    ]
  },

  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },

  plugins: [new HtmlWebpackPlugin()]
};

module.exports = env => {
  if (env.bench) {
    return Object.assign({}, CONFIG, {
      entry: {
        main: resolve(TEST_DIR, 'bench/browser.js')
      },
      output: {
        path: resolve(TEST_DIR, 'bench/dist'),
        filename: 'bundle.js'
      }
    });
  } else if (env.testBrowser) {
    return Object.assign({}, CONFIG, {
      entry: {
        main: resolve(TEST_DIR, 'browser.js')
      }
    });
  }

  return CONFIG;
};
