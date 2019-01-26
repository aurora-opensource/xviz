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

// This program populates the schema data.js which includes the full JSON
// schema content

const path = require('path');
const walk = require('walk');
const fs = require('fs');

const OUTPUT_PATH = 'src/data.js';

function main() {
  const moduleDir = path.resolve(__dirname);
  const schemaDir = path.join(moduleDir, 'schema');

  console.log(`SD: ${schemaDir}`);
  const schemaMap = loadAllSchemas(moduleDir, schemaDir);

  const outputPath = path.join(moduleDir, OUTPUT_PATH);

  dumpSchemas(schemaMap, outputPath);
}

function loadAllSchemas(moduleDir, schemaDir) {
  const schemaMap = {};
  const schemaOptions = {
    listeners: {
      file(fpath, stat, next) {
        if (stat.name.endsWith('.schema.json')) {
          // Build the path to the matching schema
          const fullPath = path.join(fpath, stat.name);
          const schemaRelPath = path.relative(schemaDir, fullPath);
          const relPath = path.relative(moduleDir, fullPath);

          try {
            const cleanedPath = schemaRelPath
              .replace(/\//g, '_')
              .replace(/\./g, '_')
              .replace(/-/g, '_')
              .replace(/__/g, '_');
            const identifier = snakeToCamel(cleanedPath);
            schemaMap[identifier] = {
              relPath,
              schemaRelPath,
              data: loadSchema(fullPath)
            };
          } catch (e) {
            console.log(`Error loading schema: ${relPath} ${e}`);
          }
        }
        next();
      }
    }
  };

  walk.walkSync(schemaDir, schemaOptions);

  return schemaMap;
}

function dumpSchemas(schemaMap, outputPath) {
  const keys = Object.keys(schemaMap).sort();

  let contents = '// DO NOT EDIT - run "node genimports.js" to remake\n\n';

  for (const key of keys) {
    const item = schemaMap[key];
    contents += `import ${key} from '../${item.relPath}';\n`;
  }

  contents += '\nexport const SCHEMA_DATA = {\n';
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const item = schemaMap[key];

    let trailer = ',';
    if (index === keys.length - 1) {
      trailer = '';
    }

    contents += `  '${item.schemaRelPath}': ${key}${trailer}\n`;
  }
  contents += '};\n';

  fs.writeFileSync(outputPath, contents);
}

function loadSchema(schemaPath) {
  let schema = {};
  try {
    const schemaContents = fs.readFileSync(schemaPath);

    schema = JSON.parse(schemaContents);
  } catch (e) {
    throw new Error(`Error parsing: ${schemaPath} ${e}`);
  }

  return schema;
}

function snakeToCamel(s) {
  return s.replace(/(\_\w)/g, m => m[1].toUpperCase());
}

// Invoke
main();
