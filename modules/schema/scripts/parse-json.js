/* global ParseError, fetch */
const {parse: jsonlintParse} = require('jsonlint');
const fs = require('fs');

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

// Exports for testing
module.exports = {
  loadJSONSync,
  loadJSON
};
