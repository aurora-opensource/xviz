require('@babel/register');
require('@babel/polyfill');

const parseArgs = require('./args');
const transform = require('./transform');
const scenes = require('./scenes');

const args = parseArgs();
if (args.listScenes) {
  scenes(args);
} else {
  transform(args);
}
