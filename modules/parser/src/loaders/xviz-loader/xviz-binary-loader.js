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

import {parseGLB, isGLB} from '../glb-loader';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

export function parseBinaryXVIZ(arrayBuffer) {
  const json = parseGLB(arrayBuffer, {magic: MAGIC_XVIZ});
  return json.xviz;
}

export function isBinaryXVIZ(arrayBuffer) {
  return isGLB(arrayBuffer, {magic: MAGIC_XVIZ});
}
