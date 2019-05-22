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

import tape from 'tape-catch';
import {preSerialize, postDeserialize} from '@xviz/parser/parsers/serialize';
import {XVIZ_MESSAGE} from '@xviz/parser';

const MESSAGE = {
  type: XVIZ_MESSAGE.TIMESLICE,
  // TODO - need to add object stream
  streams: {}
};

tape('preSerialize', t => {
  const result = preSerialize(MESSAGE);
  t.deepEquals(result, MESSAGE, 'preSerialize returned expected result');
  t.end();
});

tape('postDeserialize', t => {
  const result = postDeserialize(MESSAGE);
  t.deepEquals(result, MESSAGE, 'postDeserialize returned expected result');
  t.end();
});
