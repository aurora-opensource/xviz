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

import {LogXVIZ} from '@xviz/cli';

import test from 'tape-catch';

// TODO: make sure we have some kind of cleanup? wrap with a finally clause or something?

test('Log#construct directory exists', t => {
  // Make sure we throw if directory exists
  t.end();
});

test('Log#onConnect', t => {
  // Test for directory created but empty
  t.end();
});

test('Log#onError', t => {
  // check for 2-frame.json
  t.end();
});

test('Log#onMetadata', t => {
  // check for 1-frame.json with metadata
  t.end();
});

test('Log#onTransformLog', t => {
  // check for 2-frame.json
  t.end();
});

test('Log#onStateUpdate', t => {
  // check for 2-frame.json
  // add another messate make sure we got to 3
  t.end();
});

test('Log#onTransformLogDone', t => {
  // check for 2-frame.json
  t.end();
});

test('Log#onClose', t => {
  // TODO: check for generated index of data
  t.end();
});

test('Log#Full', t => {
  // check metadata, followed by several messages goes well
  t.end();
});

// TODO(jlisee): functions here for verify files, doing content checks and make example data
