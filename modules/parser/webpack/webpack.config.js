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

// Config for bundling workers
const path = require('path');

const BABEL_CONFIG = {
  presets: [['@babel/env', {modules: 'commonjs'}]],
  plugins: ['version-inline', '@babel/proposal-class-properties']
};

module.exports = {
  mode: 'production',

  entry: {
    'stream-data': './src/workers/stream-data.worker.js'
  },

  devtool: false,

  output: {
    path: path.resolve(__dirname, '../dist/workers'),
    filename: '[name].worker.js'
  },
  resolve: {
    alias: {
      '@xviz/io': path.resolve(__dirname, '../../io/src'),
      '@xviz/schema/dist': path.resolve(__dirname, '../../schema/dist'),
      '@xviz/schema': path.resolve(__dirname, '../../schema/src')
    }
  },
  module: {
    rules: [
      {
        // Compile ES2015 using bable
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_CONFIG
          }
        ]
      }
    ]
  },

  // Uncomment to debug
  // plugins: [new require('webpack-bundle-analyzer').BundleAnalyzerPlugin()],

  // TODO/ib - workaround for @loaders.gl/core fs dependency, remove when loaders.gl fixes this
  node: {
    fs: 'empty'
  }
};
