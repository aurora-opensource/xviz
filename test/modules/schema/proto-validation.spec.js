/* eslint no-multi-str: off */
import {loadProtos} from '@xviz/schema';
import {XVIZValidator, parseJSONFile} from '@xviz/schema';
import {Type, parse} from 'protobufjs';

import stringify from 'json-stable-stringify';
import test from 'tape-catch';
import * as path from 'path';
import * as fs from 'fs';

const EXTENSION_PROPERTY = '(xviz_json_schema)';

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
  'schema/examples/primitives/polyline/simple.json'
];

// The JSON stringify check is not happy about the extra fields ignore for now
const EXTRA_FIELDS_EXAMPLES = ['schema/examples/core/pose/extrafields.json'];

// TODO: remove this whitelist
const SUPPORTED_EXAMPLE_STRINGS = [
  'examples/primitives',
  'core/pose',
  'core/values',
  'core/variable',
  'core/annotation_visual',
  'core/annotation_state',
  'core/primitive_state',
  'core/future_instances',
  'core/stream_set',
  'session/state_update'
];

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
  const protoType = parse(
    'syntax = "proto3";\n' +
      'message Test {\n' +
      '  enum Enum {\n' +
      '    zip   = 0;\n' +
      '    zap   = 1;\n' +
      '  }\n' +
      '  Enum foo = 1;\n' +
      '  uint32 other = 2;\n' +
      '}'
  ).root.lookupType('Test');

  const goodObj = {
    foo: 'zip',
    other: 42
  };

  const expObj = {
    foo: 0,
    other: 42
  };

  stringifyEnums(protoType, goodObj);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted correct');

  const badObj = {
    foo: 'doesnotexist',
    other: 42
  };

  t.throws(() => stringifyEnums(protoType, badObj), /Error/, 'Should throw error');

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
  try {
    validator.validate(schemaName, originalJsonExample);
  } catch (e) {
    const originalString = stringify(originalJsonExample);
    t.error(e, `failed to validate(${schemaName}): ${originalString}`);
  }

  // Verify content "works" as protobuf
  const err = protoType.verify(jsonExample);
  t.ok(err === null, `No, err: ${err} for: ${examplePath}`);

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
  try {
    validator.validate(schemaName, fromProtoObject);
  } catch (e) {
    const protoString = stringify(fromProtoObject);
    t.error(e, `failed to validate(${schemaName}): ${protoString}`);
  }

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

function stringifyEnums(protoType, jsonObject) {
  const enumTypes = {};

  protoType.nestedArray.map(function store(e) {
    enumTypes[e.name] = e.values;
    return e;
  });

  const fields = protoType.fields;

  for (const fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const value = fields[fieldName];

      const values = enumTypes[value.type];

      if (values !== undefined) {
        stringifyEnumField(values, fieldName, jsonObject);
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

function isSupportedExample(examplePath) {
  for (let i = 0; i < UNSUPPORTED_EXAMPLES.length; i++) {
    if (examplePath.endsWith(UNSUPPORTED_EXAMPLES[i])) {
      return false;
    }
  }

  for (let i = 0; i < SUPPORTED_EXAMPLE_STRINGS.length; i++) {
    if (examplePath.includes(SUPPORTED_EXAMPLE_STRINGS[i])) {
      return true;
    }
  }

  return false;
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
