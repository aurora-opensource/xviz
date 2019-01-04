/* global Buffer */
import assert from 'assert';
import fs from 'fs';
import path from 'path';

export function getTimestamps(timestampsFilePath) {
  // Read and parse the timestamps
  const content = fs.readFileSync(timestampsFilePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);

  const timestamps = lines.map(line => {
    // Note: original KITTI timestamps give nanoseconds
    const unix = Date.parse(`${line} GMT`) / 1000;
    return unix;
  });

  return timestamps;
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
