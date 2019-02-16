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

/* eslint no-console: off */
/* eslint-env node, browser */

import {Root, Type} from 'protobufjs';
import {PROTO_DATA} from './data';

export const EXTENSION_PROPERTY = '(xviz_json_schema)';

export function loadProtos() {
  return Root.fromJSON(PROTO_DATA);
}

export function getXVIZProtoTypes(protoRoot) {
  const protoTypes = [];

  traverseTypes(protoRoot, type => {
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
