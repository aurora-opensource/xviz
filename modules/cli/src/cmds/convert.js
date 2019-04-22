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
import {ConvertXVIZ, ConvertFormat} from '../convert';

export function convertArgs(inArgs) {
  return inArgs.command(
    'convert [-f format] [-s start] [-e end] <src> <dst>',
    'Convert XVIZ data to another format',
    args => {
      addDataArgs(args);
      args.options('format', {
        alias: 'f',
        default: ConvertFormat.BINARY,
        choices: [ConvertFormat.BINARY, ConvertFormat.JSON],
        describe: 'Target format "json" or "binary"'
      });
      args.options('optimize', {
        type: 'boolean',
        default: true,
        describe: 'When format is "binary" this will optimize certain data types'
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
  const convert = new ConvertXVIZ(args.src, args.dst, args);

  convert.setup().then(() => {
    convert.process();
  });
}
