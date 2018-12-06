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
