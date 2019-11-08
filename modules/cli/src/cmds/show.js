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

import {addDataArgs, addMetadataArg, addCondensedArg, addStreamArg} from '../commonargs';
import {ShowXVIZ, ShowMode} from '../show';
import {openSource} from '../connect';

export function showArgs(inArgs) {
  return inArgs.command(
    'show <host> [log]',
    'Print XVIZ data to stdout',
    args => {
      addDataArgs(args);
      addMetadataArg(args, 'Just fetch metadata and exit');
      addCondensedArg(args, 'Display summary information');
      addStreamArg(args, 'Specify specific streams to show');
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
  // Determine how verbose the user wants their output
  const showMode = (() => {
    if (args.oneline) {
      return ShowMode.ONELINE;
    } else if (args.condensed) {
      return ShowMode.CONDENSED;
    }
    return ShowMode.ALL;
  })();

  // The middleware stack handle all messages
  const show = new ShowXVIZ({mode: showMode, stream: args.stream});
  const stack = [show];

  // Everything async from here...
  openSource(args, stack);
}
