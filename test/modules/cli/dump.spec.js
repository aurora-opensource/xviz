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

import {DumpXVIZ, DumpMode} from '@xviz/cli';

import test from 'tape-catch';

test('Dump#onConnect', t => {
  tDumpOneline(t, 'onConnect', /.*connected.*/i);
  t.end();
});

test('Dump#onStart', t => {
  tDumpOneline(t, 'onStart', /.*start.*/i, {});
  t.end();
});

test('Dump#onError', t => {
  tDumpOneline(t, 'onError', /.*error.*Broke.*/i, {message: 'Broke'});
  t.end();
});

test('Dump#onMetadata', t => {
  tDumpOneline(t, 'onMetadata', /.*metadata.*/i, {});
  t.end();
});

test('Dump#onTransformLog', t => {
  tDumpOneline(t, 'onTransformLog', /.*transform_log.*/i, {});

  tDumpOneline(t, 'onTransformLog', /.*transform_log.*LOG-END/i, {});

  t.end();
});

test('Dump#onStateUpdate', t => {
  tDumpOneline(t, 'onStateUpdate', /.*state_update.*/i, {updates: []});
  t.end();
});

test('Dump#onTransformLogDone', t => {
  tDumpOneline(t, 'onTransformLogDone', /.*transform_log_done.*/i, {});

  tDumpAll(t, 'onTransformLogDone', /.*transform_log_done.*foo.*/ims, {id: 'foo'});
  t.end();
});

test('Dump#onClose', t => {
  tDumpOneline(t, 'onClose', /.*close.*/i);
  t.end();
});

function tDumpOneline(t, method, regexp, msg) {
  tOneMessage(t, method, regexp, DumpMode.ONELINE, msg);
}

function tDumpAll(t, method, regexp, msg) {
  tOneMessage(t, method, regexp, DumpMode.ALL, msg);
}

function tOneMessage(t, method, regexp, mode, msg) {
  const {dump, log} = getMiddleware(mode);

  const func = dump[method];

  const args = [];

  if (msg) {
    args.push(msg);
  }

  func.apply(dump, args);

  t.equals(1, log.length, 'Should only have one message');

  t.ok(regexp.test(log[0]), `Regex ${regexp} matches message "${log[0]}"`);
}

function getMiddleware(mode) {
  const results = [];
  const log = o => {
    results.push(o);
  };

  return {log: results, dump: new DumpXVIZ({log, mode})};
}
