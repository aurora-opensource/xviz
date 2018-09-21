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

  // TODO/ib - workaround for @loaders.gl/core fs dependency, remove when loaders.gl fixes this
  node: {
    fs: 'empty'
  }
};
