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
const {loadJSONSync} = require('./parse-json');

const MODULE_DIR = path.resolve(__dirname, '..');

function main() {
  const schemaMap = loadAllFiles('schema/', '.schema.json', loadJSONSync);
  dump(schemaMap, 'dist/schema.json');

  const examplesMap = loadAllFiles('examples/', '.json');
  const invalidExamplesMap = loadAllFiles('invalid/', '.json');
  dump(
    {
      examples: Object.keys(examplesMap),
      invalid: Object.keys(invalidExamplesMap)
    },
    '../../test/modules/schema/examples.json'
  );
}

function loadAllFiles(dir, extension, getContent) {
  dir = path.resolve(MODULE_DIR, dir);
  console.log(`Loading dir: ${dir}`);

  const fileMap = {};

  walk.walkSync(dir, {
    listeners: {
      file(fpath, stat, next) {
        if (stat.name.endsWith(extension)) {
          // Build the path to the matching schema
          const fullPath = path.join(fpath, stat.name);
          const relPath = path.relative(dir, fullPath);
          fileMap[relPath] = getContent && getContent(fullPath);
        }
        next();
      }
    }
  });

  return fileMap;
}

function dump(data, outputPath) {
  outputPath = path.resolve(MODULE_DIR, outputPath);
  console.log(`Write file: ${outputPath}`);

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

// Invoke
main();
