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

import {GLTFBuilder} from '@loaders.gl/gltf';
import {toBuffer} from '@loaders.gl/core';

export function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder();

  // TODO/ib - the following options would break backwards compatibility
  // gltfBuilder.addExtraData('xviz', xvizJson, options)
  // gltfBuilder.addExtension('UBER_xviz', xvizJson, options);
  // gltfBuilder.addRequiredExtension('UBER_xviz', xvizJson, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  gltfBuilder.addApplicationData('xviz', xvizJson, options);

  return gltfBuilder.encodeAsGLB(options);
}

export function writeBinaryXVIZtoFile(sink, directory, name, json, options) {
  const glbFileBuffer = encodeBinaryXVIZ(json, options);
  sink.writeSync(directory, `${name}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  return glbFileBuffer;
}
