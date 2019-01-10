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

import {parseLogMetadata} from '@xviz/parser';
import metadataMessageV1 from 'test-data/sample-metadata-message-v1';
import metadataMessageV2 from 'test-data/sample-metadata-message';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

tape('parseLogMetadata', t => {
  let result;

  t.comment('parse v1 metadata');
  result = parseLogMetadata(metadataMessageV1);
  t.ok(result.eventStartTime && result.eventEndTime, 'polulated timestamps');

  t.comment('parse v2 metadata');
  result = parseLogMetadata(metadataMessageV2);
  t.ok(result.eventStartTime && result.eventEndTime, 'polulated timestamps');

  result = parseLogMetadata({
    version: '2.0.0',
    log_info: {
      start_time: 0,
      end_time: 10
    }
  });
  t.is(result.start_time, 0, 'handles start_time 0');

  const metadata = {...metadataMessageV2};
  delete metadata.streams;

  // verify if no 'streams' in source data, the empty object is in output
  result = parseLogMetadata(metadata);

  t.deepEqual(result.streams, {}, 'handles missing streams');
  t.end();
});
