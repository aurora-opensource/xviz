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

import {initializeWorkers, getXVIZConfig, setXVIZConfig, parseXVIZMessage} from '@xviz/parser';
import {destroyWorkerFarm} from '@xviz/parser/parsers/parse-xviz-message-workerfarm';

import tape from 'tape-catch';
import TestMetadataMessageV2 from 'test-data/sample-metadata-message';

// xviz data uses snake_case
/* eslint-disable camelcase */

// TOOD: blacklisted streams in xviz common

const isBrowser = typeof window !== 'undefined';

const metadataMessageV2 = {
  type: 'xviz/metadata',
  data: TestMetadataMessageV2
};

const xvizUpdateV2 = {
  type: 'xviz/state_update',
  data: {
    update_type: 'complete_state',
    updates: [
      {
        timestamp: 1001.3,
        primitives: {
          '/object/points': {
            points: [
              {
                points: [9, 15, 3, 20, 13, 3, 20, 5, 3]
              }
            ]
          }
        }
      }
    ]
  }
};

tape('parseXVIZMessage#parseMetadata', t => {
  parseXVIZMessage({
    message: metadataMessageV2,
    onResult: result => {
      t.equal(result.type, 'METADATA', 'Message type detected as metadata');
      t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
      t.end();
    },
    onError: err => t.fail(err),
    debug: msg => t.comment(msg),
    worker: false,
    maxConcurrency: 1
  });
});

/* global window */
tape('parseXVIZMessage#parseMetadata worker wrong version', t => {
  if (isBrowser) {
    // Ensure the version is 1
    setXVIZConfig({currentMajorVersion: 1});

    // XVIZ Version of workers would be set to 1 by default
    initializeWorkers({worker: true, maxConcurrency: 4});

    // Verify the XVIZ v2 message is properly parsed
    parseXVIZMessage({
      message: xvizUpdateV2,
      onResult: result => {
        t.equal(
          result.type,
          'INCOMPLETE',
          'XVIZ message returns INCOMPLETE due to XVIZ Version mismatch'
        );

        destroyWorkerFarm();
        t.end();
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(JSON.stringify(msg)),
      worker: true
    });
  } else {
    t.comment('-- browser only test');
    t.end();
  }
});

tape('parseXVIZMessage#parseMetadata worker', t => {
  if (isBrowser) {
    // XVIZ Version of workers would be set to 1 by default
    initializeWorkers({worker: true, maxConcurrency: 4});

    // After parsing on main thread, this will call setXVIZConfig, which
    // should trigger workers to have their XVIZ version updated
    parseXVIZMessage({
      message: metadataMessageV2,
      onResult: result => {
        t.equal(result.type, 'METADATA', 'Message type detected as metadata');
        t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(msg),
      worker: false
    });

    // Verify the XVIZ v2 message is properly parsed
    parseXVIZMessage({
      message: xvizUpdateV2,
      onResult: result => {
        t.equal(result.type, 'TIMESLICE', 'XVIZ message properly parsed on worker');
        t.end();
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(JSON.stringify(msg)),
      worker: true
    });
  } else {
    t.comment('-- browser only test');
    t.end();
  }
});

tape('parseXVIZMessage#parseMetadata multiple worker', t => {
  if (isBrowser) {
    // XVIZ Version of workers would be set to 1 by default
    initializeWorkers({id: 'A', worker: true, maxConcurrency: 1});
    initializeWorkers({id: 'B', worker: true, maxConcurrency: 1});

    // After parsing on main thread, this will call setXVIZConfig, which
    // should trigger workers to have their XVIZ version updated
    parseXVIZMessage({
      message: metadataMessageV2,
      onResult: result => {
        t.equal(result.type, 'METADATA', 'Message type detected as metadata');
        t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(msg),
      worker: false
    });

    // Verify the XVIZ v2 messages are properly parsed in different worker pools
    let resultCalled = 0;
    parseXVIZMessage({
      message: xvizUpdateV2,
      onResult: result => {
        t.equal(result.type, 'TIMESLICE', 'XVIZ message properly parsed on worker');
        resultCalled++;
        if (resultCalled === 2) {
          t.end();
        }
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(JSON.stringify(msg)),
      worker: true,
      workerId: 'A'
    });
    parseXVIZMessage({
      message: xvizUpdateV2,
      onResult: result => {
        t.equal(result.type, 'TIMESLICE', 'XVIZ message properly parsed on worker');
        resultCalled++;
        if (resultCalled === 2) {
          t.end();
        }
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(JSON.stringify(msg)),
      worker: true,
      workerId: 'B'
    });
  } else {
    t.comment('-- browser only test');
    t.end();
  }
});
