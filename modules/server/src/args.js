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
const yargs = require('yargs');

export function setupArgs() {
  const args = yargs.alias('h', 'help');

  // client can request, otherwise default to source data format
  args.options('format', {
    describe: 'Output data format',
    choices: ['JSON', 'JSON_BUFFER', 'BINARY'],
    nargs: 1
  });

  args.options('live', {
    describe: 'Return data as if from a live stream',
    boolean: true
  });

  args.options('delay', {
    describe: 'The delay between sending messages in milliseconds',
    type: 'number'
  });

  args.options('directory', {
    alias: 'd',
    describe: 'Data directory source.  Multiple directories are supported',
    type: 'string',
    group: 'Server Options:'
  });

  args.options('port', {
    describe: 'Port to listen on',
    group: 'Server Options:'
  });

  return args;
}
