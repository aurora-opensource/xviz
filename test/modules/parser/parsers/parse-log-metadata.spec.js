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
import metadataMessage from 'test-data/sample-metadata-message';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

tape('parseLogMetadata#streams is empty object', t => {
  const metadata = {...metadataMessage};
  delete metadata.streams;

  // verify if no 'streams' in source data, the empty object is in output
  const result = parseLogMetadata(metadata);

  t.deepEqual(result.streams, {}, '"streams" is empty object');
  t.end();
});
