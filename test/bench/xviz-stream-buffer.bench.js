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
import {XVIZStreamBuffer} from '@xviz/parser';

export default function xvizBench(bench) {
  return bench
    .group('XVIZ STREAM BUFFER')
    .add('XVIZStreamBuffer#insert 1000 frames into unlimited buffer', () => {
      const timeslice = generateTimeslice(50);
      let timestamp = 1;
      const TIMESLICE_COUNT = 1000;
      const streamBuffer = new XVIZStreamBuffer();

      for (let i = 0; i < TIMESLICE_COUNT; i++) {
        streamBuffer.insert({...timeslice, timestamp});
        timestamp++;
      }
    })
    .add('XVIZStreamBuffer#insert 1000 frames into limited buffer', () => {
      const timeslice = generateTimeslice(50);
      let timestamp = 1;
      const TIMESLICE_COUNT = 1000;
      const streamBuffer = new XVIZStreamBuffer({startOffset: -150, endOffset: 10});

      for (let i = 0; i < TIMESLICE_COUNT; i++) {
        streamBuffer.setCurrentTime(timestamp);
        streamBuffer.insert({...timeslice, timestamp});
        timestamp++;
      }
    })
    .add('XVIZStreamBuffer#insert 1000 frames into limited buffer + getStreams', () => {
      const timeslice = generateTimeslice(50);
      let timestamp = 1;
      const TIMESLICE_COUNT = 1000;
      const streamBuffer = new XVIZStreamBuffer({startOffset: -150, endOffset: 10});

      for (let i = 0; i < TIMESLICE_COUNT; i++) {
        streamBuffer.setCurrentTime(timestamp);
        streamBuffer.insert({...timeslice, timestamp});
        streamBuffer.getStreams();
        timestamp++;
      }
    });
}

function generateTimeslice(streamsCount) {
  const streams = {};

  for (let i = 0; i < streamsCount; i++) {
    const streamName = `stream-${i}`;
    streams[streamName] = {};
  }

  return {
    vehiclePose: {longitude: 0, latitude: 0, x: 0, y: 0, z: 0},
    streams
  };
}
