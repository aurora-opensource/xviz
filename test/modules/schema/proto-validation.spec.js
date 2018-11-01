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
import {XVIZValidator, parseJSONFile} from '@xviz/schema';
import {Type, parse} from 'protobufjs';

import stringify from 'json-stable-stringify';
import test from 'tape-catch';
import * as path from 'path';
import * as fs from 'fs';

const EXTENSION_PROPERTY = '(xviz_json_schema)';

const PRIMITIVE_PROTO_TYPES = new Set([
  'double',
  'float',
  'int32',
  'int64',
  'uint32',
  'uint64',
  'sint32',
  'sint64',
  'fixed32',
  'fixed64',
  'sfixed32',
  'sfixed64',
  'bool',
  'string',
  'bytes'
]);

// Protobuf has a primitive type system, while it produces valid XVIZ JSON
// it does not consume all the variations
const UNSUPPORTED_EXAMPLES = [
  // Colors only arrays (no variant fields)
  'schema/examples/style/object_value/hexcolor.json',
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

test('loadProtos', t => {
  const schemaDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const protoDir = path.join(schemaDir, 'proto', 'v2');

  const protoRoot = loadProtos(protoDir);
  t.ok(protoRoot.files.length > 5, 'Loaded protofiles');

  t.end();
});

test('stringifyEnumField', t => {
  const values = {zip: 0, zap: 1};

  const goodObj = {
    foo: 'zip'
  };

  const expObj = {
    foo: 0
  };

  stringifyEnumField(values, 'foo', goodObj);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted correct');

  const badObj = {
    foo: 'doesnotexist'
  };

  t.throws(() => stringifyEnumField(values, 'foo', badObj), /Error/, 'Should throw error');

  t.end();
});

test('stringifyEnums', t => {
  const protoRoot = parse(
    'syntax = "proto3";\n' +
      'message Test {\n' +
      '  enum Enum {\n' +
      '    zip   = 0;\n' +
      '    zap   = 1;\n' +
      '    sog   = 2;\n' +
      '  }\n' +
      '  Enum foo = 1;\n' +
      '  uint32 other = 2;\n' +
      '}\n' +
      'message Nested {\n' +
      '  Test sub = 1;\n' +
      '  map<string, Test> mapped = 2;\n' +
      '  map<string, uint32> primMap = 3;\n' +
      '  map<string, Test> emptyMap = 4;\n' +
      '  repeated Test list = 5;\n' +
      '  repeated string primList = 6;\n' +
      '  repeated Test emptyList = 7;\n' +
      '}'
  ).root;

  const protoType = protoRoot.lookupType('Test');

  const goodObj = {
    foo: 'zip',
    other: 42
  };

  const expObj = {
    foo: 0,
    other: 42
  };

  stringifyEnums(protoType, goodObj);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted enum');

  const badObj = {
    foo: 'doesnotexist',
    other: 42
  };

  t.throws(() => stringifyEnums(protoType, badObj), /Error/, 'Should throw error');

  // Test nesting
  const nestedType = protoRoot.lookupType('Nested');

  const nestedObj = {
    sub: {
      foo: 'sog'
    },
    mapped: {
      foo: {
        foo: 'zap',
        other: 42
      }
    },
    list: [
      {
        foo: 'zip'
      }
    ],
    primMap: {a: 4, b: 2},
    primList: ['a', 'b']
  };

  const expectedObj = {
    sub: {
      foo: 2
    },
    mapped: {
      foo: {
        foo: 1,
        other: 42
      }
    },
    list: [
      {
        foo: 0
      }
    ],
    primMap: {a: 4, b: 2},
    primList: ['a', 'b']
  };

  stringifyEnums(nestedType, nestedObj);
  t.deepEqual(nestedObj, expectedObj, 'Converted nested and mapped enums');

  t.end();
});

test('protosCorrect', t => {
  const schemaDir = path.join(__dirname, '..', '..', '..', 'modules', 'schema');
  const protoDir = path.join(schemaDir, 'proto', 'v2');
  const protoRoot = loadProtos(protoDir);

  // Test a basic primitive out
  const examplesDir = path.join(schemaDir, 'examples');

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

  stringifyEnums(protoType, jsonExample);

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

  // Populate proto object with content
  const serializedProtoData = protoType.encode(jsonExample).finish();
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

function stringifyEnums(protoType, jsonObject) {
  const enumTypes = {};

  protoType.nestedArray.map(function store(e) {
    enumTypes[e.name] = e.values;
    return e;
  });

  const fields = protoType.fields;

  // Fix up fields
  for (const fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const fieldValue = jsonObject[fieldName];

      const values = enumTypes[field.type];

      if (values !== undefined) {
        stringifyEnumField(values, fieldName, jsonObject);
      } else if (field.map) {
        stringifyMapField(field, jsonObject[fieldName]);
      } else if (field.repeated) {
        stringifyRepeatedField(field, jsonObject[fieldName]);
      } else if (typeof fieldValue === 'object') {
        stringifyMessageField(field, fieldValue);
      }
    }
  }
}

function stringifyEnumField(values, fieldName, jsonObject) {
  const originalValue = jsonObject[fieldName];

  if (originalValue !== undefined) {
    const newValue = values[originalValue];

    if (newValue === undefined) {
      const msg = `Error: ${fieldName} not present on object`;
      throw msg;
    }

    jsonObject[fieldName] = newValue;
  }
}

function stringifyMessageField(field, jsonObject) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);
    stringifyEnums(subType, jsonObject);
  }
}

function stringifyMapField(field, jsonObject) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (const propertyName in jsonObject) {
      if (jsonObject.hasOwnProperty(propertyName)) {
        const propertyValue = jsonObject[propertyName];
        stringifyEnums(subType, propertyValue);
      }
    }
  }
}

function stringifyRepeatedField(field, jsonArray) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonArray !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (let i = 0; i < jsonArray.length; i++) {
      stringifyEnums(subType, jsonArray[i]);
    }
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
function getXVIZProtoTypes(protoRoot) {
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

function traverseTypes(current, fn) {
  if (current instanceof Type)
    // and/or protobuf.Enum, protobuf.Service etc.
    fn(current);
  if (current.nestedArray)
    current.nestedArray.forEach(function eachType(nested) {
      traverseTypes(nested, fn);
    });
}
