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
/* eslint-disable no-console, complexity, max-statements */
import {FileSink, XVIZFormat, XVIZFormatWriter} from '@xviz/io';
import {ROSBAGProvider} from '../providers/rosbag-provider';

import process from 'process';
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
  provider = new ROSBAGProvider(args);
  await provider.init();

  if (provider.valid()) {
    return provider;
  }

  return null;
}

export async function Convert(args) {
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
    throw new Error('Failed to create ROSBAGProvider');
  }

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink(outputDir);

  const iterator = provider.getFrameIterator(start, end);
  if (!iterator.valid()) {
    throw new Error('Error creating and iterator');
  }

  const writer = new XVIZFormatWriter(sink, {format: XVIZFormat.BINARY});

  const md = provider.xvizMetadata();
  setMetadataTimes(md.message().data, start, end);
  writer.writeMetadata(md);

  // If we get interrupted make sure the index is written out
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

  writer.close();
}

/* eslint-disable camelcase */
function setMetadataTimes(metadata, start, end) {
  if (start || end) {
    if (start) {
      const logInfo = metadata.log_info || {};
      logInfo.start_time = start;
    }

    if (end) {
      const logInfo = metadata.log_info || {};
      logInfo.end_time = end;
    }
  }
}
/* eslint-enable camelcase */

function signalWriteIndexOnInterrupt(writer) {
  process.on('SIGINT', () => {
    console.log('Aborting, writing index file.');
    writer.close();
    process.exit(0); // eslint-disable-line no-process-exit
  });
}
