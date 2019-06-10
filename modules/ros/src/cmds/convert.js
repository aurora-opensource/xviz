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
import {XVIZ_FORMAT, XVIZFormatWriter} from '@xviz/io';
import {FileSource, FileSink} from '@xviz/io/node';
import {XVIZProviderFactory} from '@xviz/io';

import {ROS2XVIZFactory} from '../core/ros-2-xviz-factory';
import {ROSBAGProvider} from '../providers/rosbag-provider';
import {defaultConverters} from '../messages';

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

export class ROSXVIZConverter {
  async execute(args, providerFactory = XVIZProviderFactory) {
    const {bag: bagPath, dir: outputDir, start, end} = args;

    try {
      deleteDirRecursive(outputDir);
    } catch (err) {
      // ignore
    }
    createDir(outputDir);

    const root = bagPath;
    const source = new FileSource(root);
    // TODO: dump args
    console.log(root);
    console.log(JSON.stringify(args, null, 2));
    console.log(JSON.stringify(providerFactory, null, 2)); // eslint-disable-line

    const provider = await providerFactory.open({
      options: {...args},
      source,
      root
    });

    if (!provider) {
      throw new Error('Failed to create ROSBAGProvider');
    }

    // This abstracts the details of the filenames expected by our server
    const sink = new FileSink(outputDir);

    const iterator = provider.getMessageIterator(start, end);
    if (!iterator.valid()) {
      throw new Error('Error creating and iterator');
    }

    // TODO: format as options
    const writer = new XVIZFormatWriter(sink, {format: XVIZ_FORMAT.BINARY_GLB});

    const md = provider.xvizMetadata();
    setMetadataTimes(md.message().data, start, end);
    writer.writeMetadata(md);

    // If we get interrupted make sure the index is written out
    signalWriteIndexOnInterrupt(writer);

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

async function registerROSBAGProvider(bagPath, rosConfig, args) {
  console.log(`Converting data at ${bagPath}`); // eslint-disable-line
  if (rosConfig) {
    console.log(`Using config ${rosConfig}`); // eslint-disable-line
  }
  console.log(`Saving to ${args.dir}`); // eslint-disable-line

  let config = null;
  if (rosConfig) {
    // topicConfig: { keyTopic, topics }
    // mapping: [ { topic, name, config: {xvizStream, field} }, ... ]
    const data = fs.readFileSync(rosConfig);
    if (data) {
      config = JSON.parse(data);
    }
  }

  const ros2xvizFactory = new ROS2XVIZFactory(defaultConverters);
  const rosbagProviderConfig = {
    ...config,
    ros2xvizFactory
  };

  // root, dataProvider, options
  console.log('Adding ROSBAG');
  XVIZProviderFactory.addProviderClass(ROSBAGProvider, rosbagProviderConfig);
}

export async function Convert(args) {
  await registerROSBAGProvider(args.bag, args.rosConfig, args);

  const converter = new ROSXVIZConverter();  
  await converter.execute(args);
}
