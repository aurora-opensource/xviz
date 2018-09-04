/* eslint no-console: off */
/* eslint-env node, browser */

import * as path from 'path';
import * as walk from 'walk';
import * as fs from 'fs';

// See: https://github.com/epoberezkin/ajv/issues/687
const Ajv = require('ajv');

export function validateExampleFiles(schemaDir, examplesDir) {
  const validator = new Ajv();

  loadAllSchemas(validator, schemaDir);

  return validateFiles(validator, examplesDir);
}

function loadAllSchemas(validator, schemaDir) {
  const schemaOptions = {
    listeners: {
      file(fpath, stat, next) {
        if (stat.name.endsWith('.schema.json')) {
          // Build the path to the matching schema
          const fullPath = path.join(fpath, stat.name);
          const relPath = path.relative(schemaDir, fullPath);

          try {
            loadSchema(validator, schemaDir, relPath);
          } catch (e) {
            console.log(`Error loading schema: ${relPath} ${e}`);
          }
        }
        next();
      }
    }
  };

  walk.walkSync(schemaDir, schemaOptions);
}

function loadSchema(validator, schemaDir, relativePath) {
  // Load the Schema
  const schemaPath = path.join(schemaDir, relativePath);

  console.log(`Load: ${relativePath}`);

  let schema;
  try {
    const schemaContents = fs.readFileSync(schemaPath);

    schema = JSON.parse(schemaContents);
  } catch (e) {
    throw new Error(`Error parsing: ${schemaPath} ${e}`);
  }

  validator.addSchema(schema, relativePath);
}

function validateFiles(validator, examplesDir) {
  let valid = true;
  const options = {
    listeners: {
      file(fpath, stat, next) {
        if (!stat.name.endsWith('~')) {
          // Build the path to the matching schema
          const examplePath = path.join(fpath, stat.name);
          try {
            valid = valid & validateFile(validator, examplesDir, examplePath);
          } catch (e) {
            console.log(`Error validating: ${examplePath} ${e}`);
          }
        }
        next();
      }
    }
  };

  walk.walkSync(examplesDir, options);

  return valid;
}

function validateFile(validator, examplesDir, examplePath) {
  const exampleRelPath = path.relative(examplesDir, examplePath);

  const schemaRelPath = exampleRelPath.replace('.json', '.schema.json');

  // Load the JSON to validate
  const contents = fs.readFileSync(examplePath);
  let data;
  try {
    data = JSON.parse(contents);
  } catch (e) {
    throw new Error(`Error parsing: examplePath} ${e}`);
  }

  // Lookup the schema and validate
  const validate = validator.getSchema(schemaRelPath);
  const valid = validate(data);

  if (!valid) {
    console.log(`Fail: ${examplePath}`);
    console.log(`Schema: ${schemaRelPath}`);
    console.log(validate.errors);
  } else {
    console.log(`Pass: ${examplePath}`);
  }

  return valid;
}
