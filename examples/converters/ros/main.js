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
import {serverArgs} from '@xviz/server';
import {registerROSBagProvider} from '@xviz/ros';

// Setup ROS Provider
function setupROSProvider(args) {
  if (args.rosConfig) {
    registerROSBagProvider(args.rosConfig);
  }
}

function main() {
  const yargs = require('yargs');

  let args = yargs.alias('h', 'help');

  args = serverArgs(args, {defaultCommand: true});

  // This will parse and execute the server command
  args.middleware(setupROSProvider).parse();
}

main();
