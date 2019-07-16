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

const parser = new ArgumentParser({
  addHelp: true,
  description: 'KITTI to XVIZ converter'
});

parser.addArgument(['-d', '--data-directory'], {
  required: true,
  help: 'Path to raw KITTI data.'
});

parser.addArgument(['-o', '--output'], {
  required: true,
  help: 'Path to generated data.'
});

parser.addArgument('--json', {
  action: 'storeTrue',
  help: 'Generate JSON XVIZ output instead of the GLB file format'
});

parser.addArgument('--protobuf', {
  action: 'storeTrue',
  help: 'Generate Protobuf XVIZ output instead of the GLB file file format'
});

parser.addArgument(['--disable-streams'], {
  defaultValue: '',
  help: 'Comma separated stream names to disable'
});

parser.addArgument(['--message-limit'], {
  defaultValue: Number.MAX_SAFE_INTEGER,
  help: 'Limit XVIZ message generation to this value. Useful for testing conversion quickly'
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
  action: 'storeTrue',
  help: 'Generate fake streams with random data for testing'
});

// extract args from user input
module.exports = function getArgs() {
  const args = parser.parseArgs();
  const inputDir = args.data_directory;
  const outputDir = args.output;

  console.log(inputDir, outputDir); // eslint-disable-line
  const disabledStreams = args.disable_streams.split(',').filter(Boolean);
  return {
    inputDir,
    outputDir,
    disabledStreams,
    fakeStreams: args.fake_streams,
    imageMaxWidth: Number(args.image_max_width),
    imageMaxHeight: Number(args.image_max_height),
    messageLimit: Number(args.message_limit),
    writeJson: Number(args.json),
    writeProtobuf: Number(args.protobuf)
  };
};
