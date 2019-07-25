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

/* eslint-disable camelcase */
import {FileSink} from '@xviz/io/node';
import {XVIZBinaryWriter, XVIZJSONWriter, XVIZProtobufWriter} from '@xviz/io';

import {KittiConverter} from './converters';

import process from 'process';

module.exports = async function main(args) {
  const {
    inputDir,
    outputDir,
    disabledStreams,
    fakeStreams,
    messageLimit,
    cameraSources,
    imageMaxWidth,
    imageMaxHeight,
    writeJson,
    writeProtobuf
  } = args;

  // This object orchestrates any data dependencies between the data sources
  // and delegates to the individual converters
  const converter = new KittiConverter(inputDir, outputDir, {
    cameraSources,
    disabledStreams,
    fakeStreams,
    imageMaxWidth,
    imageMaxHeight
  });

  console.log(`Converting KITTI data at ${inputDir}`); // eslint-disable-line
  console.log(`Saving to ${outputDir}`); // eslint-disable-line

  converter.initialize();

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink(outputDir);
  let xvizWriter = null;
  if (writeJson) {
    xvizWriter = new XVIZJSONWriter(sink);
  } else if (writeProtobuf) {
    xvizWriter = new XVIZProtobufWriter(sink);
  } else {
    xvizWriter = new XVIZBinaryWriter(sink);
  }

  // Write metadata file
  const xvizMetadata = converter.getMetadata();
  xvizWriter.writeMetadata(xvizMetadata);

  // If we get interrupted make sure the index is written out
  signalWriteIndexOnInterrupt(xvizWriter);

  const start = Date.now();

  const limit = Math.min(messageLimit, converter.messageCount());
  // Convert each message and write it to a file
  //
  // A *message* is a point in time, where each message will contain
  // a *pose* and any number of XVIZ data sets.
  //
  // In the KITTI data set we are able to iterate directly by *message* number
  // since the data has been synchronized. However, another approach
  // would be to iterate over data sets by time.  Since dealing with synchronized
  // data is easier, we have choosen this path for the initial example to avoid
  // any unnecessary complications
  for (let i = 0; i < limit; i++) {
    const xvizMessage = await converter.convertMessage(i);
    xvizWriter.writeMessage(i, xvizMessage);
  }

  xvizWriter.close();

  const end = Date.now();
  console.log(`Generate ${limit} messages in ${end - start}s`); // eslint-disable-line
};

function signalWriteIndexOnInterrupt(writer) {
  process.on('SIGINT', () => {
    console.log('Aborting, writing index file.'); // eslint-disable-line
    writer.close();
    process.exit(0); // eslint-disable-line no-process-exit
  });
}
