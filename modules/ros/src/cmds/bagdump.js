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
/* global console */
/* eslint-disable no-console, max-depth */
import {open, TimeUtil} from 'rosbag';
import {StartEndOptions} from './common';

export function bagdumpArgs(inArgs) {
  const cmd = 'bagdump <bag>';

  return inArgs.command(
    cmd,
    'Display information about a ROS bag',
    {
      ...StartEndOptions,
      topic: {
        alias: 't',
        description: 'The topic to inspect'
      },
      dumpTime: {
        type: 'boolean',
        description: 'Show start and end time of the bag'
      },
      dumpTopics: {
        type: 'boolean',
        description: 'Show start and end time of the bag'
      },
      dumpMessages: {
        type: 'boolean',
        description: 'Will dump messages, if a topic is provided only those will be dumped'
      },
      dumpDefs: {
        type: 'boolean',
        description: 'Will dump message definitions'
      }
    },
    bagdumpCmd
  );
}

export async function bagdumpCmd(args) {
  const {bag: source, topic: mainTopic} = args;

  const bag = await open(source);

  if (args.dumpTime) {
    console.log(`start_time: ${TimeUtil.toDate(bag.startTime).getTime() / 1e3}`);
    console.log(`end_time: ${TimeUtil.toDate(bag.endTime).getTime() / 1e3}`);
  }

  if (args.dumpTopics) {
    const seen = [];
    for (const conn in bag.connections) {
      const {messageDefinition, topic, type} = bag.connections[conn];

      if (!seen[topic]) {
        seen[topic] = true;

        console.log(topic, type);
        if (args.dumpDefs) {
          console.log(messageDefinition);
        }
      }
    }
  }

  if (args.dumpMessages) {
    await bag.readMessages({}, ({topic, message}) => {
      if (!mainTopic || topic === mainTopic) {
        console.log(JSON.stringify(message, null, 2));
      }
    });
  }
}
