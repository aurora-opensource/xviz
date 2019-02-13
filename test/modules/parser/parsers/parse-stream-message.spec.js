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

import {initializeWorkers, getXVIZConfig, parseStreamMessage} from '@xviz/parser';

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

tape('parseStreamMessage#parseMetadata', t => {
  parseStreamMessage({
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
tape('parseStreamMessage#parseMetadata worker', t => {
  if (isBrowser) {
    // XVIZ Version of workers would be set to 1 by default
    initializeWorkers({worker: true, maxConcurrency: 4});

    // After parsing on main thread, this will call setXVIZConfig, which
    // should trigger workers to have their XVIZ version updated
    parseStreamMessage({
      message: metadataMessageV2,
      onResult: result => {
        t.equal(result.type, 'METADATA', 'Message type detected as metadata');
        t.equal(getXVIZConfig().currentMajorVersion, 2, 'XVIZ Version set to 2');
      },
      onError: err => t.fail(err),
      debug: msg => t.comment(msg),
      worker: false
    });

    const xvizUpdate = {
      type: 'xviz/state_update',
      data: {
        update_type: 'snapshot',
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

    // Verify the XVIZ v2 message is properly parsed
    parseStreamMessage({
      message: xvizUpdate,
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
