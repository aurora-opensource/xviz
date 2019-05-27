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
import {XVIZBinaryWriter} from '@xviz/io';

import {zeroPaddedPrefix} from './common';
import NuTonomyConverter from './converters/nutonomy-converter';
import StaticData from './converters/static-data';

module.exports = async function main(args) {
  const {
    inputDir,
    samplesDir,
    disabledStreams,
    fakeStreams,
    messageLimit,
    scenes,
    imageMaxWidth,
    imageMaxHeight,
    keyframes
  } = args;

  const staticData = new StaticData(inputDir);
  for (const scene of scenes) {
    const sceneName = `scene-${zeroPaddedPrefix(scene, 4)}`;
    const outputDir = `${args.outputDir}/${sceneName}`;
    // This object orchestrates any data dependencies between the data sources
    // and delegates to the individual converters
    const converter = new NuTonomyConverter(inputDir, outputDir, samplesDir, staticData, {
      disabledStreams,
      sceneName,
      fakeStreams,
      imageMaxWidth,
      imageMaxHeight,
      keyframes
    });

    console.log(`Converting NuScenes data scene ${sceneName} at ${inputDir}`); // eslint-disable-line
    console.log(`Saving to ${outputDir}`); // eslint-disable-line

    converter.initialize();

    // This abstracts the details of the filenames expected by our server
    const sink = new FileSink(outputDir);
    const xvizWriter = new XVIZBinaryWriter(sink);

    // Write metadata file
    const xvizMetadata = converter.getMetadata();
    xvizWriter.writeMetadata(xvizMetadata);

    const start = Date.now();

    const limit = Math.min(messageLimit, converter.messageCount());
    for (let i = 0; i < limit; i++) {
      const xvizMessage = await converter.convertMessage(i);
      if (xvizMessage) {
        xvizWriter.writeMessage(i, xvizMessage);
      }
    }

    xvizWriter.close();

    const end = Date.now();
    console.log(`Generate ${limit} messages in ${end - start}s`); // eslint-disable-line
  }
};
