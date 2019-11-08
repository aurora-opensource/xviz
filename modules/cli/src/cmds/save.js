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

/* eslint no-console: ["error", { allow: ["log"] }] */
/* eslint-env node, browser */

import {addDataArgs} from '../commonargs';
import {SaveXVIZ} from '../save';
import {openSource} from '../connect';

export function saveArgs(inArgs) {
  return inArgs.command(
    'save <host> [log]',
    'Save XVIZ data to disk',
    args => {
      addDataArgs(args);
      args.options('output', {
        alias: 'o',
        describe: 'Directory to save the messages'
      });
    },
    args => {
      command(args);
    }
  );
}

/**
 * Validate the content and order of XVIZ messages
 */
export default function command(args) {
  // The middleware stack handle all messages
  const save = new SaveXVIZ({output: args.output});
  const stack = [save];

  // Everything async from here...
  openSource(args, stack);
}
