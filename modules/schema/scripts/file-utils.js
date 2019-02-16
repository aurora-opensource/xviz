/* eslint-disable no-console */
/* global console */
const path = require('path');
const walk = require('walk');
const fs = require('fs');

function loadAllFiles(dir, extension, getContent) {
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
  console.log(`Write file: ${outputPath}`);

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

module.exports = {
  loadAllFiles,
  dump
};
