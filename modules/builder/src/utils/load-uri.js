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

// Based on binary-gltf-utils under MIT license: Copyright (c) 2016-17 Karl Cheng

/* global Buffer */

export function loadUri(uri, rootFolder = '.') {
  const path = module.require('path');
  const fs = module.require('fs');

  if (uri.startsWith('http:') || uri.startsWith('https:')) {
    return Promise.reject(new Error('request based loading of URIs not implemented'));
  }

  if (uri.startsWith('data:')) {
    return Promise.resolve(parseDataUri(uri));
  }

  const filePath = path.join((rootFolder = '.'), uri);
  return fs.readFileAsync(filePath).then(buffer => ({buffer}));
}

/**
 * Parses a data URI into a buffer, as well as retrieving its declared MIME type.
 *
 * @param {string} uri - a data URI (assumed to be valid)
 * @returns {Object} { buffer, mimeType }
 */
export function parseDataUri(uri) {
  const dataIndex = uri.indexOf(',');

  let buffer;
  let mimeType;
  if (uri.slice(dataIndex - 7, dataIndex) === ';base64') {
    buffer = new Buffer(uri.slice(dataIndex + 1), 'base64');
    mimeType = uri.slice(5, dataIndex - 7).trim();
  } else {
    buffer = new Buffer(decodeURIComponent(uri.slice(dataIndex + 1)));
    mimeType = uri.slice(5, dataIndex).trim();
  }

  if (!mimeType) {
    mimeType = 'text/plain;charset=US-ASCII';
  } else if (mimeType[0] === ';') {
    mimeType = `text/plain${mimeType}`;
  }

  return {buffer, mimeType};
}
