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

const {ArgumentParser} = require('argparse');
const path = require('path');

const parser = new ArgumentParser({
  addHelp: true,
  description: 'KITTI to XVIZ converter'
});

parser.addArgument(['-d', '--data-directory'], {
  required: true,
  help: 'Path to raw KITTI data. Relative path will be resolved relative to /data/kitti/'
});

parser.addArgument(['-o', '--output'], {
  help: 'Path to generated data. Relative path will be resolved relative to /data/generated/kitti/'
});

parser.addArgument('--json', {
  action: 'storeTrue',
  help: 'Generate JSON XVIZ output instead of the binary file format'
});

parser.addArgument(['--disable-streams'], {
  defaultValue: '',
  help: 'Comma separated stream names to disable'
});

parser.addArgument(['--frame-limit'], {
  defaultValue: Number.MAX_SAFE_INTEGER,
  help: 'Limit XVIZ frame generation to this value. Useful for testing conversion quickly'
});

parser.addArgument(['--image-max-width'], {
  defaultValue: 400,
  help: 'Image max width'
});

parser.addArgument(['--image-max-height'], {
  defaultValue: 300,
  help: 'Image max height'
});

parser.addArgument('--fake-streams', {
  defaultValue: '',
  help: 'Generate fake streams with random data for testing'
});

// extract args from user input
module.exports = function getArgs() {
  const args = parser.parseArgs();
  const inputDir = path.resolve(__dirname, '../../../../data/kitti', args.data_directory);
  const outputDir = path.resolve(
    __dirname,
    '../../../../data/generated/kitti',
    args.out || args.data_directory
  );
  console.log(inputDir, outputDir); // eslint-disable-line
  const disabledStreams = args.disable_streams.split(',').filter(Boolean);
  return {
    inputDir,
    outputDir,
    disabledStreams,
    fakeStreams: Boolean(args.fake_streams),
    imageMaxWidth: Number(args.image_max_width),
    imageMaxHeight: Number(args.image_max_height),
    frameLimit: Number(args.frame_limit),
    writeJson: Number(args.json)
  };
};
