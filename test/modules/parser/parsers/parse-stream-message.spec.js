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

import {setXvizConfig, parseStreamMessage} from '@xviz/parser';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

// Metadata is the first message
// const TestMetadataMessage = xvizStreamMessages[0];

// TOOD: blacklisted streams in xviz common
//
tape('parseStreamMessage#import', t => {
  setXvizConfig({});

  // TODO - issues under Node.js
  // const metaMessage = parseStreamMessage(TestMetadataMessage);

  t.ok(parseStreamMessage, 'parseStreamMessage imported ok');
  t.end();
});
