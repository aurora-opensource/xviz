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

/* global Buffer */
import assert from 'assert';
import fs from 'fs';
import path from 'path';

export async function getTimestamps(db) {
  // Read and parse the timestamps
  const lines = await getRosbagTimestamps(db);

  const timestamps = lines.map(line => {
    // Note: original Rosbag2 timestamps give nanoseconds
    const unix = nanosecondsToXVIZDateTime(line);
    return unix;
  });

  return timestamps;
}

export function nanosecondsToXVIZDateTime(nanosecondsEpoch) {
  return nanosecondsEpoch / 1e9;
}

async function getRosbagTimestamps(db) {
  return new Promise(function(resolve, reject) {
    db.all('SELECT timestamp FROM messages', resolve);
  });
}

export function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // make sure parent exists
    const parent = path.dirname(dirPath);
    createDir(parent);

    fs.mkdirSync(dirPath);
  }
}

export function deleteDirRecursive(parentDir) {
  const files = fs.readdirSync(parentDir);
  files.forEach(file => {
    const currPath = path.join(parentDir, file);
    if (fs.lstatSync(currPath).isDirectory()) {
      // recurse
      deleteDirRecursive(currPath);
    } else {
      // delete file
      fs.unlinkSync(currPath);
    }
  });

  fs.rmdirSync(parentDir);
}

export function toBuffer(ab) {
  assert(ab instanceof ArrayBuffer);
  const buf = new Buffer(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

export function toArrayBuffer(buf) {
  assert(buf instanceof Buffer);
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}
