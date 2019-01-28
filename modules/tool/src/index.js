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

// Tool interface (move most of these somewhere else)
import {XVIZMiddlewareStack} from './middleware';
import {DumpXVIZ, DumpMode} from './dump';
import {WebSocketInterface} from './websocket';

// Pull in sub commands
import {validateArgs} from './cmds/validate';
import {dumpArgs} from './cmds/dump';

/**
 * Main function for entire tool
 */
function main() {
  let args = yargs.alias('h', 'help');

  args = dumpArgs(args);
  args = validateArgs(args);

  return args.argv;
}

module.exports = {
  XVIZMiddlewareStack,
  DumpXVIZ,
  DumpMode,
  WebSocketInterface,
  main
};
