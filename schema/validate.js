/* eslint no-console: off */
/* eslint-env node, browser */

const path = require('path');
const walk = require('walk');
const Ajv = require('ajv');
const fs = require('fs');

function main() {
  const ajv = new Ajv();

  const schema_dir = path.resolve(__dirname);

  load_all_schemas(ajv, schema_dir);

  const examples_dir = path.join(schema_dir, 'examples');

  validate_examples(ajv, examples_dir);
}

function load_all_schemas(ajv, schema_dir) {
  const schema_options = {
    listeners: {
      file(fpath, stat, next) {
        if (stat.name.endsWith('.schema.json')) {
          // Build the path to the matching schema
          const full_path = path.join(fpath, stat.name);
          const rel_path = path.relative(schema_dir, full_path);

          try {
            load_schema(ajv, schema_dir, rel_path);
          } catch (e) {
            console.log(`Error loading schema: ${rel_path} ${e}`);
          }
        }
        next();
      }
    }
  };

  walk.walkSync(schema_dir, schema_options);
}

function load_schema(ajv, schema_dir, relative_path) {
  // Load the Schema
  const schema_path = path.join(schema_dir, relative_path);

  console.log(`Load: ${relative_path}`);

  let schema;
  try {
    const schema_contents = fs.readFileSync(schema_path);

    schema = JSON.parse(schema_contents);
  } catch (e) {
    throw new Error(`Error parsing: ${schema_path} ${e}`);
  }

  ajv.addSchema(schema, relative_path);
}

function validate_examples(ajv, examples_dir) {
  const options = {
    listeners: {
      file(fpath, stat, next) {
        if (!stat.name.endsWith('~')) {
          // Build the path to the matching schema
          const example_path = path.join(fpath, stat.name);
          try {
            validate_example(ajv, examples_dir, example_path);
          } catch (e) {
            console.log(`Error validating: ${example_path} ${e}`);
          }
        }
        next();
      }
    }
  };

  walk.walkSync(examples_dir, options);
}

function validate_example(ajv, examples_dir, example_path) {
  const example_rel_path = path.relative(examples_dir, example_path);

  const schema_rel_path = example_rel_path.replace('.json', '.schema.json');

  // Load the JSON to validate
  const contents = fs.readFileSync(example_path);
  let data;
  try {
    data = JSON.parse(contents);
  } catch (e) {
    throw new Error(`Error parsing: example_path} ${e}`);
  }

  // Lookup the schema and validate
  const validate = ajv.getSchema(schema_rel_path);
  const valid = validate(data);

  if (!valid) {
    console.log(`Fail: ${example_path}`);
    console.log(`Schema: ${schema_rel_path}`);
    console.log(validate.errors);
  } else {
    console.log(`Pass: ${example_path}`);
  }
}

// Invoke
main();
