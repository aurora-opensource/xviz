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
import {XVIZFormatWriter} from '@xviz/io';
import {FileSource, FileSink} from '@xviz/io/node';
import {XVIZProviderFactory} from '@xviz/io';

import {StartEndOptions} from './common';

import process from 'process';
import fs from 'fs';
import path from 'path';

export function convertArgs(inArgs) {
  const cmd = 'convert [-d output] <bag>';

  return inArgs.command(
    cmd,
    'Convert a rosbag to xviz',
    {
      ...StartEndOptions,
      directory: {
        alias: 'd',
        describe: 'Directory to save XVIZ data',
        type: 'string',
        required: true
      },
      rosConfig: {
        describe: 'Path to ROS Bag JSON configuration',
        type: 'string',
        required: true
      },
      format: {
        describe: 'Output data format',
        default: 'BINARY_GLB',
        choices: ['JSON_STRING', 'BINARY_GLB'],
        nargs: 1
      }
    },
    convertCmd
  );
}

export async function convertCmd(args) {
  const {bag, directory, start, end, format} = args;

  // Setup output directory
  try {
    deleteDirRecursive(directory);
  } catch (err) {
    // ignore
  }
  createDir(directory);

  const source = new FileSource(bag);
  const provider = await XVIZProviderFactory.open({
    options: {...args},
    source,
    root: bag
  });

  if (!provider) {
    throw new Error('Failed to create ROSBagProvider');
  }

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink(directory);

  const iterator = provider.getMessageIterator({startTime: start, endTime: end});
  if (!iterator.valid()) {
    throw new Error('Error creating and iterator');
  }

  const writer = new XVIZFormatWriter(sink, {format});

  const md = provider.xvizMetadata();

  // Augment metadata with timing information
  // if provided
  setMetadataTimes(md.message().data, start, end);
  writer.writeMetadata(md);

  // If we get interrupted make sure the index is written out
  signalWriteIndexOnInterrupt(writer);

  // Process data
  let frameSequence = 0;
  while (iterator.valid()) {
    const data = await provider.xvizMessage(iterator);
    if (data) {
      process.stdout.write(`Writing frame ${frameSequence}\r`);
      writer.writeMessage(frameSequence, data);
      frameSequence += 1;
    } else {
      console.log(`No data for frame ${frameSequence}`);
    }
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
