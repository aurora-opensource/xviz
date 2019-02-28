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
/* eslint-disable camelcase */
import sampleXVIZMetadata from 'test-data/sample-metadata-message.json';
import sampleXVIZSnapshot from 'test-data/sample-xviz.json';
import sampleXVIZStylesheet from 'test-data/xviz-style-sheet.json';

import {setXVIZConfig, XVIZStyleParser, parseStreamMessage, LOG_STREAM_MESSAGE} from '@xviz/parser';

setXVIZConfig({currentMajorVersion: 2});

function parse(message, opts) {
  let result;
  parseStreamMessage({
    message,
    onResult: msg => {
      if (msg.type === LOG_STREAM_MESSAGE.INCOMPLETE) {
        throw new Error('incomplete message');
      }
      result = msg;
    },
    onError: err => {
      throw new Error(err);
    },
    ...opts
  });

  return result;
}

const getBuffer = xvizString => {
  const buf = new Buffer(xvizString);
  const length = buf.byteLength / Uint8Array.BYTES_PER_ELEMENT;
  return new Uint8Array(buf.buffer, buf.byteOffset, length);
};
const xvizTestString = JSON.stringify(sampleXVIZSnapshot.updates);
const xvizTestBuffer = getBuffer(xvizTestString);
const stringTestJSON = {
  update_type: sampleXVIZSnapshot.update_type,
  updates: xvizTestString
};

const binaryTestJSON = {
  update_type: sampleXVIZSnapshot.update_type,
  updates: xvizTestBuffer
};

export default function xvizBench(bench) {
  return bench
    .group('PARSE XVIZ')
    .add('xviz#parseMetadata', () => parse(sampleXVIZMetadata))
    .add('xviz#parseFrame', () => parse(sampleXVIZSnapshot))
    .add('xviz#parseFrame_StringJSON', () => parse(stringTestJSON))
    .add('xviz#parseFrame_BinaryJSON', () => parse(binaryTestJSON))
    .add('xviz#parseStylesheet', () => new XVIZStyleParser(sampleXVIZStylesheet));
}
