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

/* eslint-disable max-len */
import test from 'tape-catch';

import {
  _GLBBufferPacker as GLBBufferPacker,
  _unpackGLBBuffers as unpackGLBBuffers
} from '@xviz/builder';

const BUFFERS = [
  new Int8Array([3, 2, 3]),
  new Uint16Array([6, 2, 4, 5]),
  new Float32Array([8, 2, 4, 5])
];

test('pack-and-unpack-buffers', t => {
  const bufferPacker = new GLBBufferPacker();
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers(BUFFERS);

  t.equal(jsonDescriptors.bufferViews[0].byteOffset, 0, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[0].byteLength, 3, 'should be equal');

  t.equal(jsonDescriptors.bufferViews[1].byteOffset, 4, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[1].byteLength, 8, 'should be equal');

  t.equal(jsonDescriptors.bufferViews[2].byteOffset, 12, 'should be equal');
  t.equal(jsonDescriptors.bufferViews[2].byteLength, 16, 'should be equal');

  const buffers2 = unpackGLBBuffers(arrayBuffer, jsonDescriptors);

  t.comment(JSON.stringify(BUFFERS));
  t.comment(JSON.stringify(buffers2));
  t.deepEqual(BUFFERS, buffers2, 'should be deep equal');
  t.end();
});
