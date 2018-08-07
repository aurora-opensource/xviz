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

import GLBContainer from './helpers/glb-container';
import unpackGLBBuffers from './helpers/unpack-glb-buffers';
import {unpackJsonArrays} from './helpers/pack-json-arrays';

export function parseGLB(arrayBuffer, options = {}) {
  const {json, binaryByteOffset} = GLBContainer.parseGlbBuffer(arrayBuffer, options);
  const unpackedBuffers = unpackGLBBuffers(arrayBuffer, json, binaryByteOffset);
  return unpackJsonArrays(json, unpackedBuffers);
}
