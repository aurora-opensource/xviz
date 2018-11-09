/* eslint no-console: off */
/* eslint-env node, browser */

import * as path from 'path';
import * as fs from 'fs';

import {Root, Type} from 'protobufjs';

export const EXTENSION_PROPERTY = '(xviz_json_schema)';

export function loadProtos(protoDir) {
  // Gather up all the protobuf files
  const protos = fs.readdirSync(protoDir).map(f => path.join(protoDir, f));

  // Create our namespace
  const protoRoot = new Root();

  // Load in all the protobuf files at once

  protoRoot.loadSync(protos, {keepCase: true});

  return protoRoot;
}

export function getXVIZProtoTypes(protoRoot) {
  const protoTypes = [];

  traverseTypes(protoRoot, function walk(type) {
    if (type.options !== undefined) {
      if (type.options[EXTENSION_PROPERTY] !== undefined) {
        protoTypes.push(type);
      }
    }
  });

  return protoTypes;
}

function traverseTypes(current, fn) {
  if (current instanceof Type)
    // and/or protobuf.Enum, protobuf.Service etc.
    fn(current);
  if (current.nestedArray)
    current.nestedArray.forEach(function eachType(nested) {
      traverseTypes(nested, fn);
    });
}
