import {CustomConvert} from '../common/custom-convert';

const yargs = require('yargs')
  .alias('h', 'help')
  .command(
    ['convert [-d output] <bag>', '$0'],
    'Convert a rosbag to xviz',
    {
      start: {
        alias: 's',
        describe: 'Starting timestamp to begin conversion'
      },
      end: {
        alias: 'e',
        describe: 'Ending timestamp to stop conversion'
      },
      dir: {
        alias: 'd',
        describe: 'Directory to save XVIZ data',
        demandOption: true
      },
      rosConfig: {
        describe: 'Path to ROS Bag configuration',
        type: 'string'
      }
    },
    CustomConvert
  );

// Main - this will parse args and execute the default command 'convert'
yargs.parse();
