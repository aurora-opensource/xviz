// Webpack 2 configuration file for running tests in browser
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {resolve} = require('path');

const TEST_DIR = './test';

const TEST_BROWSER_CONFIG = {
  mode: 'development',

  devServer: {
    stats: {
      warnings: false
    },
    progress: true
  },

  // Bundle the tests for running in the browser
  entry: {
    'test-browser': resolve(TEST_DIR, 'browser.js')
  },

  devtool: '#inline-source-maps',

  resolve: {
    // Adding `esnext` imports untranspiled source, easier for debugging
    // mainFields: ['esnext', 'browser', 'module', 'main'],
    alias: {
      webworkify$: resolve(__dirname, '../node_modules/webworkify-webpack'),
      'test-data': resolve(TEST_DIR, 'data'),
      '@xviz/builder': resolve(TEST_DIR, '../modules/builder/src'),
      '@xviz/parser': resolve(TEST_DIR, '../modules/parser/src'),
      '@xviz/schema': resolve(TEST_DIR, '../modules/schema/src')
    }
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

module.exports = TEST_BROWSER_CONFIG;
