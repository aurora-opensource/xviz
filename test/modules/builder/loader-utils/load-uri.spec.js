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

// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
/* global Buffer */
import test from 'tape-catch';
import {parseDataUri} from '@xviz/builder/loader-utils/load-uri.js';

test('parseDataUri', t => {
  let obj;
  let buf;

  obj = parseDataUri('data:text/html;base64,PGh0bWw+');
  t.equals(obj.mimeType, 'text/html', 'should record down correct MIME type');

  obj = parseDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'I love you!', 'should work with non-padded base64 data URIs');

  obj = parseDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE=');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'I love you!', 'should work with padded base64 data URIs');

  obj = parseDataUri('data:text/plain,important content!');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should work with plain data URIs');

  obj = parseDataUri('data:,important content!');
  t.equals(obj.mimeType, 'text/plain;charset=US-ASCII', 'should set default MIME type');

  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should work with default MIME type');

  obj = parseDataUri('data:;charset=utf-8,important content!');
  t.equals(
    obj.mimeType,
    'text/plain;charset=utf-8',
    'should allow implicit text/plain with charset'
  );

  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should allow implicit text/plain with charset');

  t.end();
});
