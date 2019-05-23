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

/* eslint-disable camelcase */
import test from 'tape-catch';
import {FileSink, FileSource} from '@xviz/io/node';

const isBrowser = typeof window !== 'undefined';

test('Node-Only imports#file system related', t => {
  if (isBrowser) {
    t.equals(FileSink, undefined, 'FileSink is undefined in the browser');
    t.equals(FileSource, undefined, 'FileSource is undefined in the browser');
  } else {
    t.notEquals(FileSink, undefined, 'FileSink is defined in node');
    t.notEquals(FileSource, undefined, 'FileSource is defined node');
  }

  t.end();
});
