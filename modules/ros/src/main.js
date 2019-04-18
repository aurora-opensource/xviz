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
/* global process, console  */
/* eslint-disable no-console */
require('@babel/register');
require('babel-polyfill');

import {
  BagDump,
  Convert,
} from './cmds';

const yargs = require('yargs')
  .alias('h', 'help')
  .command(
    'convert [-d output] <bag>',
    'Convert a rosbag to xviz',
    { 
      start: {
        alias: 's',
        describe: 'Starting timestamp to begin conversion'
      },
      end: {
        alias: 'e',
        describe: 'Ending timestamp to stop conversion',
      },
      dir: {
        alias: 'd',
        describe: 'Directory to save XVIZ data',
        demandOption: true
      }
    },
    Convert)
  .command(
    'bagdump <bag>',
    'Display information about a ROS bag',
    { 
      topic: {
        alias: 't',
        description: 'The topic to inspect'
      },
      start: {
        alias: 's',
        describe: 'Starting timestamp to begin dump'
      },
      end: {
        alias: 'e',
        describe: 'Ending timestamp to stop dump',
      },
      dumpTime: {
        type: 'boolean',
        description: 'Show start and end time of the bag'
      },
      dumpAllTopics: {
        type: 'boolean',
        description: 'Show start and end time of the bag'
      },
      dumpMessages: {
        type: 'boolean',
        description: 'Will dump messages, if a topic is provided only those will be dumped'
      }
    },
    BagDump);

export function main() {
  yargs.parse();
}
