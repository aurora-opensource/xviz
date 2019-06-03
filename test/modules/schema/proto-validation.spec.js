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

/* eslint no-multi-str: off */
import {loadProtos} from '@xviz/schema';
import {
  XVIZValidator,
  getProtoEnumTypes,
  protoEnumsToInts,
  getXVIZProtoTypes,
  EXTENSION_PROPERTY
} from '@xviz/schema';

import {diffDeepEquals} from '../../util/diff-deep-equals';
import {loadJSON} from '../../../scripts/file-utils';
import EXAMPLES from './examples.json';

import test from 'tape-catch';
import path from 'path';
import clone from 'clone';

// Protobuf has a primitive type system, while it produces valid XVIZ JSON
// it does not consume all the variations
const UNSUPPORTED_EXAMPLES = [
  // Colors only arrays (no variant fields)
  'schema/examples/style/object_value/hexcolor.json',
  'schema/examples/style/object_value/hexcolor_short.json',
  'schema/examples/style/object_value/hexcolor_short_alpha.json',
  'schema/examples/style/object_value/hexcolor_alpha.json',

  // Points only flat (no variant fields)
  'schema/examples/primitives/point/complex.json',
  'schema/examples/primitives/point/simple.json',
  'schema/examples/primitives/point/per_point_colors.json',
  'schema/examples/primitives/polygon/complex.json',
  'schema/examples/primitives/polygon/simple.json',
  'schema/examples/primitives/polyline/complex.json',
  'schema/examples/primitives/polyline/simple.json',
  'schema/examples/session/metadata/nested_camera.json'
];

// The JSON stringify check is not happy about the extra fields ignore for now
const EXTRA_FIELDS_EXAMPLES = ['schema/examples/core/pose/extrafields.json'];

function getModuleDir() {
  const moduleDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  return moduleDir;
}

test('loadProtos', t => {
  const protoRoot = loadProtos();
  t.ok(protoRoot.get('xviz'), 'Loaded protofiles');

  t.end();
});

test('protosCorrect', t => {
  const protoRoot = loadProtos();

  // Test a basic primitive out
  const examplesDir = path.join(getModuleDir(), 'examples');

  const validator = new XVIZValidator();

  // For each protobuf type
  const protoTypes = getXVIZProtoTypes(protoRoot);
  t.ok(protoTypes.length > 5, 'Have protos connected to schemas');

  const protoEnumTypes = getProtoEnumTypes(protoRoot);
  t.ok(Object.keys(protoEnumTypes).length > 5, 'Found enum types');

  const tests = [];

  for (let i = 0; i < protoTypes.length; i++) {
    const type = protoTypes[i];

    const schemaName = type.options[EXTENSION_PROPERTY];
    t.comment(schemaName);

    // Make sure we have a matching JSON schema
    t.ok(validator.hasSchema(schemaName), `"${schemaName}" is a real schema`);

    // Validate every example
    const exampleFiles = EXAMPLES.examples
      .filter(
        // Some schemas start with the name of other so we have to match againg
        // a concreate file path or directory not plain prefix.
        filePath => filePath.match(new RegExp(`^${schemaName}[\./\]`, 'g'))
      )
      .map(filePath => path.join(examplesDir, filePath));

    for (let j = 0; j < exampleFiles.length; j++) {
      const examplePath = exampleFiles[j];

      if (isSupportedExample(examplePath)) {
        tests.push(
          loadJSON(examplePath).then(json => {
            t.comment(`Checking: Proto ${type} (Schema: ${schemaName}) Example: ${examplePath}`);
            validateAgainstExample(t, validator, type, protoEnumTypes, examplePath, json);
          })
        );
      }
    }
  }

  Promise.all(tests).then(() => t.end());
});

/* eslint-disable-next-line max-params */
function validateAgainstExample(t, validator, protoType, protoEnumTypes, examplePath, jsonExample) {
  const originalJsonExample = clone(jsonExample);

  protoEnumsToInts(protoType, jsonExample, protoEnumTypes);

  // Sanity check out input data
  const schemaName = protoType.options[EXTENSION_PROPERTY];
  validateXVIZJSON(t, validator, schemaName, originalJsonExample, 'Example JSON');

  // Verify content "works" as protobuf
  verifyProto(t, protoType, jsonExample, `Protobuf verified`);

  // Populate proto object with content, we do "fromObject" first
  // so that the well known types will be handled
  const protoObject = protoType.fromObject(jsonExample);
  const serializedProtoData = protoType.encode(protoObject).finish();
  const protoData = protoType.decode(serializedProtoData);

  // Dump to Object
  const options = {
    enums: String, // Use strings instead of numbers
    bytes: String // Use base64 string instead of Uint8Array
  };
  const fromProtoObject = protoType.toObject(protoData, options);

  // Validate JSON with JSON schema
  validateXVIZJSON(t, validator, schemaName, fromProtoObject, 'Proto round trip JSON');

  // Now lets make sure we handled all fields
  if (!exampleHasExtraFields(examplePath)) {
    diffDeepEquals(t, originalJsonExample, fromProtoObject, `Full round trip equivalent`);
  }
}

function verifyProto(t, protoType, jsonExample, msg) {
  const err = protoType.verify(jsonExample);
  if (err) {
    t.fail(`${msg}: ${err}, example: ${JSON.stringify(jsonExample, '', 4)}`);
  } else {
    t.pass(msg);
  }
}
function validateXVIZJSON(t, validator, schemaName, object, description) {
  t.doesNotThrow(
    () => validator.validate(schemaName, object),
    `Valid (schema: ${schemaName}): ${description}`
  );
}

function isSupportedExample(examplePath) {
  for (let i = 0; i < UNSUPPORTED_EXAMPLES.length; i++) {
    if (examplePath.endsWith(UNSUPPORTED_EXAMPLES[i])) {
      return false;
    }
  }
  return true;
}

function exampleHasExtraFields(examplePath) {
  for (let i = 0; i < EXTRA_FIELDS_EXAMPLES.length; i++) {
    if (examplePath.endsWith(EXTRA_FIELDS_EXAMPLES[i])) {
      return true;
    }
  }

  return false;
}
