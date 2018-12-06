const {ArgumentParser} = require('argparse');
const path = require('path');

const parser = new ArgumentParser({
  addHelp: true,
  description: 'Example XVIZ stream server'
});

parser.addArgument(['-d', '--data_directory'], {
  required: true,
  help: 'Directory to serve data from. Relative path will be resolved relative to /data/generated/'
});

parser.addArgument(['--port'], {
  defaultValue: 8081,
  help: 'Websocket port to use'
});

parser.addArgument(['--frame_limit'], {
  type: Number,
  help: 'Reduce or extend the number of frames to send'
});

parser.addArgument(['--delay'], {
  defaultValue: 50,
  type: Number,
  help: 'Message send interval, 50ms as default'
});

parser.addArgument(['--duration'], {
  defaultValue: 30000,
  type: Number,
  help: 'Set duration of log data if not specified, 30 seconds default'
});

parser.addArgument(['--skip_images'], {
  defaultValue: false,
  help: 'Will not send video frames'
});

module.exports = function getArgs() {
  const args = parser.parseArgs();
  // eslint-disable-next-line camelcase
  args.data_directory = path.resolve(__dirname, '../../data/generated/', args.data_directory);
  return args;
};
