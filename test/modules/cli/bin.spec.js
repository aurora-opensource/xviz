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

const spawn = require('cross-spawn');
const path = require('path');

import test from 'tape-catch';

const XVIZ_PATH = path.resolve(__dirname, '../../../modules/cli/bin/xviz');

test('Bin#cli-help', t => {
  const cliProcess = spawn.sync(XVIZ_PATH, ['--help'], {
    encoding: 'utf8'
  });

  const error = cliProcess.error;

  t.equal(error, null, 'Can call program with no error');

  const fetchedText = cliProcess.stdout.trim();

  t.ok(fetchedText.indexOf('Commands') >= 0, 'cli tool help has command list');
  t.ok(fetchedText.indexOf('Options') >= 0, 'cli tool help has options list');
  t.ok(fetchedText.indexOf('xviz dump') >= 0, 'cli tool help describes dump command');

  t.end();
});
