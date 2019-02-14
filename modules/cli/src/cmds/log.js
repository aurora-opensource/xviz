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

import {addDataArgs, addMetadataArg} from '../commonargs';
import {LogXVIZ} from '../log';
import {openSource} from '../connect';

export function logArgs(inArgs) {
  return inArgs.command(
    'log <host> <log> <outputdir>',
    'Save XVIZ data to a directory',
    args => {
      addDataArgs(args);
      addMetadataArg(args, 'Just save metadata and exit');
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
  const log = new LogXVIZ(args.outputdir);
  const stack = [log];

  // Everything async from here...
  openSource(args, stack);
}
