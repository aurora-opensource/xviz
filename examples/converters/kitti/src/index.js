require('@babel/register');
require('babel-polyfill');

const parseArgs = require('./args');
const transform = require('./transform');

(async function main() {
  await transform(parseArgs());
})();
