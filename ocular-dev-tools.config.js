const {resolve} = require('path');

module.exports = {
  lint: {
    paths: ['modules', 'docs', 'test', 'examples'],
    extensions: ['js', 'md']
  },

  aliases: {
    // TEST
    'test-data': resolve(__dirname, 'test/data'),
    // Hack: during test, make things work without babel-plugin-inline-import
    '../../dist/workers/stream-data.worker.js': resolve(__dirname, 'test/modules/parser/stream-data.worker.js'),

    '@xviz/conformance': resolve(__dirname, 'modules/conformance'),
    '@xviz/schema/dist': resolve(__dirname, 'modules/schema/dist')
  },

  entry: {
    test: 'test/index.js',
    'test-browser': 'test/browser.js',
    bench: 'test/bench/index.js',
    'bench-browser': 'test/bench/browser.js'
  }
};
