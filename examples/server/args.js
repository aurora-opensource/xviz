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

/* eslint-disable camelcase */
const {ArgumentParser} = require('argparse');
const path = require('path');

const parser = new ArgumentParser({
  addHelp: true,
  description: 'Example XVIZ stream server'
});

parser.addArgument(['-d', '--data_directory'], {
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
  help: 'Message send interval in milliseconds. 50ms as default'
});

parser.addArgument(['--duration'], {
  defaultValue: 30,
  type: Number,
  help: 'Set duration in seconds of log data. 30s as default'
});

parser.addArgument(['--scenario'], {
  defaultValue: '',
  type: String,
  help: 'Select from available scenarios: "circle", "straight"'
});

parser.addArgument(['--live'], {
  defaultValue: false,
  action: 'storeTrue',
  help: 'Behave like a live system and send XVIZ data immediately after metadata.'
});

parser.addArgument(['--skip_images'], {
  defaultValue: false,
  help: 'Will not send video frames'
});

module.exports = function getArgs() {
  const args = parser.parseArgs();
  if (args.data_directory) {
    args.data_directory = path.resolve(__dirname, '../../data/generated/', args.data_directory);
  }

  return args;
};
