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

  // client can request
  args.options('format', {
    describe: 'output data could be json, json_buffer, binary'
  });

  args.options('live', {
    describe: 'Setup server and data to behave like a live system',
    boolean: true
  });

  args.options('loop', {
    describe: 'Setup server and data to behave like a live system'
  });

  args.options('duration', {
    describe: 'Setup server and data to behave like a live system'
  });

  args.options('limit', {
    describe: 'Setup server and data to behave like a live system'
  });

  // --delay [50]
  // --d
  // --port [3000]
  // --validate

  // stream filters
  // --include
  // --exclude
  //
  // preload [true]

  return args;
}
