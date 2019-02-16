/* eslint-disable no-console */
/* global ParseError, fetch, console */
const path = require('path');
const walk = require('walk');
const fs = require('fs');
const {parse: jsonlintParse} = require('jsonlint');

function parseJSON(string, filePath) {
  let data;
  try {
    data = JSON.parse(string);
  } catch (e) {
    try {
      jsonlintParse(string);
    } catch (egood) {
      // Ugly hack to get the line number out of the jsonlint error
      const lineRegex = /line ([0-9]+)/g;
      const results = lineRegex.exec(egood.message);
      let line = 0;
      if (results !== null) {
        line = parseInt(results[1], 10);
      }

      // Return the best error we can
      throw new ParseError(`${filePath}:${line}: ${egood}`);
    }
  }
  return data;
}

// This parser generates more readable error message if the json is invalid
function loadJSONSync(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseJSON(content);
}

function loadJSON(filePath) {
  if (fs.readFile) {
    // node
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseJSON(data, filePath));
        }
      });
    });
  }
  return fetch(filePath)
    .then(resp => resp.text())
    .then(data => parseJSON(data, filePath));
}

function walkDir(dir, extension, getContent) {
  const fileMap = {};

  walk.walkSync(dir, {
    listeners: {
      file(fpath, stat, next) {
        if (!extension || stat.name.endsWith(extension)) {
          // Build the path to the matching schema
          const fullPath = path.join(fpath, stat.name);
          const relPath = path.relative(dir, fullPath);
          fileMap[relPath] = getContent && getContent(fullPath);
        }
        next();
      }
    }
  });

  console.log(`${Object.keys(fileMap).length} files loaded from ${dir}`);
  return fileMap;
}

function dump(data, outputPath) {
  console.log(`\u001b[92mWriting to file\u001b[39m ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

module.exports = {
  walkDir,
  loadJSON,
  loadJSONSync,
  dump
};
