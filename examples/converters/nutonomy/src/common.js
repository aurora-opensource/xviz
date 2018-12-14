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
import fs from 'fs';
import path from 'path';
import assert from 'assert';

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

export function parseJsonFile(dirPath, fileName) {
  return JSON.parse(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
}

/**
 * Generate a zero prefix number with given length
 * @param number number to be added zero prefix
 * @param digits the max length of zero prefix
 * @returns {string} string of length of the given `digits`
 */
export function zeroPaddedPrefix(number, digits) {
  const prefix = new Array(digits).fill(0).join('');
  const zp = `${prefix}${number.toString()}`;
  return zp.substr(-digits);
}

export function toMap(arr, key, value) {
  return arr.reduce((resMap, item) => {
    let mapKey = null;
    let mapValue = null;

    if (typeof key === 'function') {
      mapKey = key(item);
    }
    if (typeof value === 'function') {
      mapValue = value(item, key);
    }

    mapKey = mapKey || item[key];
    mapValue = mapValue || value || item;

    resMap[mapKey] = mapValue;
    return resMap;
  }, {});
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

export function parseBinary(data) {
  if (data instanceof ArrayBuffer) {
    return new Float32Array(data);
  }
  return null;
}

export function quaternionToEulerAngle(w, x, y, z) {
  const ysqr = y * y;
  const t0 = -2.0 * (ysqr + z * z) + 1.0;
  const t1 = 2.0 * (x * y + w * z);
  let t2 = -2.0 * (x * z - w * y);
  const t3 = 2.0 * (y * z + w * x);
  const t4 = -2.0 * (x * x + ysqr) + 1.0;

  t2 = t2 > 1.0 ? 1.0 : t2;
  t2 = t2 < -1.0 ? -1.0 : t2;

  const pitch = Math.asin(t2);
  const roll = Math.atan2(t3, t4);
  const yaw = Math.atan2(t1, t0);

  return {roll, pitch, yaw};
}
