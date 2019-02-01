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

import {openSource} from '../connect';
import {addDataArgs, addMetadataArg, addCondensedArg} from '../commonargs';
import {XVIZSessionValidator} from '@xviz/schema';

import {default as indentString} from 'indent-string';
import {default as Table} from 'cli-table3';
import {default as colors} from 'colors';

export function validateArgs(inArgs) {
  return inArgs.command(
    'validate <host> [log]',
    'Validate XVIZ data and message flow',
    args => {
      addDataArgs(args);
      addMetadataArg(args, 'Just check the metadata');
      addCondensedArg(args, 'Display summary information');

      args.options('type', {
        alias: 't',
        describe: 'Just report on this type'
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
export function command(args) {
  // Validate the message flow
  const options = {verbose: !args.condensed};

  if (!args.condensed) {
    options.invalidCallback = (t, e, m) => {
      printValidationError(t, e, m, args);
    };
  }

  const validator = new XVIZSessionValidator(options);

  let printed = false;
  const printSummary = () => {
    if (!printed) {
      printErrorSummary(validator.stats, args);
      printed = true;
    }
  };

  // Report validation as we go
  const reportValidation = {
    onMetadata: msg => {
      if (args.metadata) {
        printSummary();
      }
    },
    onTransformLogDone: msg => {
      printSummary();
    },
    onClose: () => {
      printSummary();
    }
  };

  // The middleware stack handle all messages
  const stack = [validator, reportValidation];

  // Everything async from here...
  openSource(args, stack);
}

function printErrorSummary(stats, args) {
  // Form a table of the main errors one row per type
  const table = new Table({
    head: ['Type', 'Count', 'Invalid', 'Inv %', 'Unique Errors'],
    style: {head: ['white', 'bold']}
  });

  for (const message in stats.messages) {
    const count = stats.messages[message] || 0;
    const errors = stats.validationErrors[message] || 0;
    const errPer = (errors / count) * 100;

    const uniqueErrors = stats.uniqueErrors[message];
    const uniqueErrorCount = uniqueErrors ? Object.keys(uniqueErrors).length : 0;

    const row = [message, count, errors, errPer.toFixed(1), uniqueErrorCount];

    if (errors) {
      const coloredRow = [];
      row.forEach(e => {
        coloredRow.push(colors.red.bold(e));
      });
      table.push(coloredRow);
    } else {
      table.push(row);
    }
  }

  // console.log(stats);
  console.log(table.toString());
}

// Print details about a validation error
function printValidationError(msgType, err, msg, args) {
  if (msg && displayType(msgType, args)) {
    // TODO(jlisee): look into ajv-errors package to simplify this output
    const msgStr = indentString(JSON.stringify(msg, null, 4), 4);
    const errStr = indentString(err.toString(), 4);
    console.log(`VALIDATION ERROR:\n  TYPE: ${msgType}\n  DETAILS:\n${errStr}\n  MSG:\n${msgStr}`);
  }
}

// Return true if we should display information about this message type
function displayType(msgType, args) {
  let display = true;
  if (args.type && args.type.toLowerCase() !== msgType.toLowerCase()) {
    display = false;
  }

  return display;
}
