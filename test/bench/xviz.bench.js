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

import xvizStreamMessages from 'test-data/xviz-stream';
import xvizStylesheet from 'test-data/xviz-style-sheet.json';
// Metadata is the first message
const TestMetadataMessage = xvizStreamMessages[0];
const TestMessage = xvizStreamMessages[1];

import {XvizStyleParser, parseStreamLogData, XvizObject} from 'xviz';

const xvizObject = new XvizObject({id: 1, index: 0});

export default function xvizBench(bench) {
  return bench
    .group('PARSE XVIZ')
    .add('xviz#parseMetadata', () => parseStreamLogData(TestMetadataMessage))

    .add('xviz#parseFrame', () => parseStreamLogData(TestMessage))

    .add('xviz#parse1second', () =>
      xvizStreamMessages.forEach(message => parseStreamLogData(message))
    )

    .add('xviz#parseStylesheet', () => new XvizStyleParser(xvizStylesheet))

    .add(
      'XvizObject#_getSemanticColor',
      // setLabel triggers a call to _getSemanticColor
      () => {
        xvizObject._setLabel('OBJECT_LABEL_VEHICLE');
        xvizObject._setLabel('OBJECT_LABEL_BICYCLE');
        xvizObject._setLabel('OBJECT_LABEL_PEDESTRIAN');
      }
    );
}
