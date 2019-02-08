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
  parseJSONFile,
  protoEnumsToInts,
  getXVIZProtoTypes,
  EXTENSION_PROPERTY
} from '@xviz/schema';

import stringify from 'json-stable-stringify';
import test from 'tape-catch';
import * as path from 'path';
import * as fs from 'fs';

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

function getProtoDir() {
  return path.join(getModuleDir(), 'proto', 'v2');
}

test('loadProtos', t => {
  const protoRoot = loadProtos(getProtoDir());
  t.ok(protoRoot.files.length > 5, 'Loaded protofiles');

  t.end();
});

test('protosCorrect', t => {
  const protoRoot = loadProtos(getProtoDir());

  // Test a basic primitive out
  const examplesDir = path.join(getModuleDir(), 'examples');
  const schemaDir = path.join(getModuleDir(), 'schema');

  const validator = new XVIZValidator();

  // For each protobuf type
  const protoTypes = getXVIZProtoTypes(protoRoot);
  t.ok(protoTypes.length > 5, 'Have protos connected to schemas');

  for (let i = 0; i < protoTypes.length; i++) {
    const type = protoTypes[i];

    const schemaName = type.options[EXTENSION_PROPERTY];

    // Make sure we have a matching JSON schema
    const schemaPath = path.join(schemaDir, `${schemaName}.schema.json`);
    t.ok(fs.existsSync(schemaPath), `"${schemaName}" is a real schema`);

    // Validate every example
    const exampleFiles = getSchemaExamplePath(t, examplesDir, schemaName);

    for (let j = 0; j < exampleFiles.length; j++) {
      const examplePath = exampleFiles[j];

      if (isSupportedExample(examplePath)) {
        validateAgainstExample(t, validator, type, examplePath);
      }
    }
  }

  t.end();
});

function validateAgainstExample(t, validator, protoType, examplePath) {
  // Parse the example
  const jsonExample = parseJSONFile(examplePath);
  const originalJsonExample = parseJSONFile(examplePath);

  protoEnumsToInts(protoType, jsonExample);

  // Sanity check out input data
  const schemaName = protoType.options[EXTENSION_PROPERTY];

  validateXVIZJSON(t, validator, schemaName, originalJsonExample, 'Original');

  // Verify content "works" as protobuf
  const err = protoType.verify(jsonExample);
  if (err === null) {
    t.ok(true, `Protobuf verify good for: ${examplePath}`);
  } else {
    const content = stringify(jsonExample, {space: ' '});
    t.fail(`JSON failed proto verify, err: ${err} for: ${examplePath}, content: ${content}`);
  }

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
  validateXVIZJSON(t, validator, schemaName, fromProtoObject, 'Proto rount trip');

  // Now lets make sure we handled all fields
  if (!exampleHasExtraFields(examplePath)) {
    const originalString = stringify(originalJsonExample, {space: ' '});
    const protoString = stringify(fromProtoObject, {space: ' '});

    if (originalString !== protoString) {
      t.fail(`Input JSON: ${originalString} != Proto JSON: ${protoString}`);
    } else {
      t.ok(true, `Full round trip: ${protoType.name} for: ${examplePath}`);
    }
  }
}

function validateXVIZJSON(t, validator, schemaName, object, description) {
  try {
    validator.validate(schemaName, object);
  } catch (e) {
    const jsonString = stringify(object);
    t.error(e, `${description} failed to validate(${schemaName}): ${jsonString}`);
  }
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

function getSchemaExamplePath(t, examplesDir, schemaName) {
  let exampleFiles = [];

  const directoryPath = path.join(examplesDir, schemaName);

  if (fs.existsSync(directoryPath)) {
    // If we have a directory of examples gather them up
    exampleFiles = fs.readdirSync(directoryPath).map(f => path.join(directoryPath, f));
    t.ok(exampleFiles.length > 0, `Schema: ${schemaName} has example files`);
  } else {
    // Otherwise just look for an example file
    const exampleFile = path.join(examplesDir, `${schemaName}.json`);
    if (fs.existsSync(exampleFile)) {
      exampleFiles.push(exampleFile);
    }
  }

  return exampleFiles;
}
