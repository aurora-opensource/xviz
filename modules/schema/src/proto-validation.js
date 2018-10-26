/* eslint no-console: off */
/* eslint-env node, browser */

import * as path from 'path';
import * as fs from 'fs';

import {Root} from 'protobufjs';

export function loadProtos(protoDir) {
  // Gather up all the protobuf files
  const protos = fs.readdirSync(protoDir).map(f => path.join(protoDir, f));

  // Create our namespace
  const protoRoot = new Root();

  // Load in all the protobuf files at once

  protoRoot.loadSync(protos, {keepCase: true});

  return protoRoot;
}
