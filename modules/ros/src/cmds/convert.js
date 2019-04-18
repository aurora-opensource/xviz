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
/* global console */
/* eslint-disable no-console */
import {FileSink, XVIZFormat, XVIZFormatWriter} from '@xviz/io';
import {Bag} from '../bag/bag';
import {TimeUtil} from 'rosbag';

import {ROSBAGDataProvider} from '../providers/rosbag-data-provider';

import {FrameBuilder} from '../bag/frame-builder';

const process = require('process');
const loggingStartTime = process.hrtime();
const NS_PER_SEC = 1e9;

import fs from 'fs';
import path from 'path';

function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    // make sure parent exists
    const parent = path.dirname(dirPath);
    createDir(parent);

    fs.mkdirSync(dirPath);
  }
}

function deleteDirRecursive(parentDir) {
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

async function createProvider(args) {
  let provider = null;
  // root, dataProvider, options
  provider = new ROSBAGDataProvider(args);
  await provider.init();

  if (provider.valid()) {
    return provider;
  }

  return null;
}

function deltaTimeMs(startT) {
  const diff = process.hrtime(startT || loggingStartTime);
  return ((diff[0] * NS_PER_SEC + diff[1]) / 1e6).toFixed(3);
}

export async function Convert(args) {
  const profileStart = Date.now();

  const {bag: bagPath, dir: outputDir, start, end} = args;

  console.log(`Converting data at ${bagPath}`); // eslint-disable-line
  console.log(`Saving to ${outputDir}`); // eslint-disable-line

  try {
    deleteDirRecursive(outputDir);
  } catch (err) {
    // ignore
  }
  createDir(outputDir);

  // TODO: fix that key topic is fixed
  // TODO: fix that topics is baked into the 'bag'
  const options = {};
  const provider = await createProvider({root: bagPath, options});
  if (!provider) {
    process.exit(1);
  }

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink(outputDir);

  console.log(start, end);
  const iterator = provider.getFrameIterator(start, end);
  console.log(JSON.stringify(iterator));
  if (!iterator.valid()) {
    console.log('Error creating and iterator, exiting');
    process.exit(2);
  }

  const writer = new XVIZFormatWriter(sink, {format: XVIZFormat.binary});
  writer.writeMetadata(provider.xvizMetadata());

  signalWriteIndexOnInterrupt(writer);

  let frameSequence = 0;
  while (iterator.valid()) {
    const data = await provider.xvizFrame(iterator);
    if (!data) {
      throw new Error(`No data for frame ${frameSequence}`);
    }

    process.stdout.write(`Writing frame ${frameSequence}\r`);
    writer.writeFrame(frameSequence, data);
    frameSequence += 1;
  }

  writer.writeFrameIndex();
}

function signalWriteIndexOnInterrupt(writer) {
  process.on('SIGINT', () => {
    console.log('Aborting, writing index file.');
    writer.writeFrameIndex();
    process.exit(0); // eslint-disable-line no-process-exit
  });
}
