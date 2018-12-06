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

/* global process */
/*
 * Generic Utilities
 */
const {spawnSync} = require('child_process');

// return object with status , errors, stdout, stderr
function createZipFromFolder(folder, dst) {
  return spawnSync('tar', ['-czf', dst, folder], {timeout: 30000});
}

// return object with status , errors, stdout, stderr
function extractZipFromFile(file) {
  return spawnSync('tar', ['-xzf', file], {timeout: 30000});
}

const startTime = process.hrtime();
const NS_PER_SEC = 1e9;

// Return time in milliseconds since
// argument or startTime of process.
function deltaTimeMs(startT) {
  const diff = process.hrtime(startT || startTime);
  return ((diff[0] * NS_PER_SEC + diff[1]) / 1e6).toFixed(3);
}

module.exports = {
  createZipFromFolder,
  extractZipFromFile,
  deltaTimeMs
};
