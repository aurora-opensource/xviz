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

import {initializeWorkers, getXVIZConfig, parseStreamMessage, setXVIZConfig} from '@xviz/parser';

import tape from 'tape-catch';
import TestMetadataMessage from 'test-data/sample-metadata-message';

// xviz data uses snake_case
/* eslint-disable camelcase */

// TOOD: blacklisted streams in xviz common

const metadataMessage = {
  type: 'xviz/metadata',
  data: TestMetadataMessage
};

tape('parseStreamMessage#parseMetadata', t => {
  const onResult = result => {
    t.equal(result.type, 'METADATA', 'Message type detected as metadata');
    t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
    t.end();
  };

  // TODO - issues under Node.js
  const metaMessage = parseStreamMessage({
    message: metadataMessage,
    onResult,
    onError: err => t.fail(err),
    debug: msg => console.log(msg),
    worker: false,
    maxConcurrency: 1
  });
});

tape.skip('parseStreamMessage#parseMetadata worker', t => {
  initializeWorkers({worker: true, maxConcurrency: 2});

  const onResult = result => {
    console.log(result);
    // t.equal(result.type, 'METADATA', 'Message type detected as metadata');
    // t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
    // t.end();
  };

  // TODO - issues under Node.js
  const metaMessage = parseStreamMessage({
    message: metadataMessage,
    onResult,
    onError: err => t.fail(err),
    debug: msg => console.log(msg),
    worker: true
  });
});
