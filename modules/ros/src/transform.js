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
import {FileSink, XVIZBinaryWriter} from '@xviz/io';
import * as Topics from './topics';
import {Bag} from './bag';
import {TimeUtil} from 'rosbag';

import {createDir, deleteDirRecursive} from './lib/util';
import FrameBuilder from './frame-builder';

const process = require('process');
const loggingStartTime = process.hrtime();
const NS_PER_SEC = 1e9;

function deltaTimeMs(startT) {
  const diff = process.hrtime(startT || loggingStartTime);
  return ((diff[0] * NS_PER_SEC + diff[1]) / 1e6).toFixed(3);
}

export default async function transform(args) {
  const profileStart = Date.now();

  const {bag: bagPath, outputDir, disableStreams, frameLimit = Number.MAX_VALUE} = args;

  console.log(`Converting data at ${bagPath}`); // eslint-disable-line
  console.log(`Saving to ${outputDir}`); // eslint-disable-line

  try {
    deleteDirRecursive(outputDir);
  } catch (err) {
    // ignore
  }
  createDir(outputDir);
  const bag = new Bag({
    bagPath,
    keyTopic: Topics.CURRENT_POSE,
    topics: Topics.ALL
  });

  const {origin, frameIdToPoseMap} = await bag.calculateMetadata();
  const frameBuilder = new FrameBuilder({
    origin,
    frameIdToPoseMap,
    disableStreams
  });

  // This abstracts the details of the filenames expected by our server
  const sink = new FileSink(outputDir);
  const xvizWriter = new XVIZBinaryWriter(sink);

  let frameNum = 0;
  let startTime = null;
  let endTime = null;
  await bag.readFrames(async frame => {
    try {
      if (frameNum < frameLimit) {
        endTime = TimeUtil.toDate(frame.keyTopic.timestamp);

        if (!startTime) {
          startTime = endTime;
        }

        const loadtime = process.hrtime();
        const xvizFrame = await frameBuilder.buildFrame(frame);
        const dataload = deltaTimeMs(loadtime);
        console.log(`--- frame: ${frameNum} ${dataload}ms ${endTime.valueOf() / 1000.0}`);
        xvizWriter.writeFrame(frameNum, xvizFrame);
        frameNum++;
      }
    } catch (err) {
      console.error(err);
    }
  });

  if (!startTime) {
    throw new Error('No key frames found');
  }

  // Write metadata file
  const xb = frameBuilder.getXVIZMetadataBuilder();
  xb.startTime(startTime.getTime() / 1e3).endTime(endTime.getTime() / 1e3);
  xvizWriter.writeMetadata(xb.getMetadata());

  xvizWriter.writeFrameIndex();

  const profileEnd = Date.now();
  console.log(`Generate ${frameNum} frames in ${(profileEnd - profileStart) / 1000}s`); // eslint-disable-line
}
