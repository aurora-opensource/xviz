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

// TODO: remove this code, it duplicates io/src/writers/xviz-binary-writer.js

export const XVIZ_GLTF_EXTENSION = 'AVS_xviz'; // copied from @xviz/parser

import '@loaders.gl/polyfills';
import {GLTFBuilder} from '@loaders.gl/gltf';
import {packBinaryJson} from './xviz-pack-binary';

export function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder(options);

  // Pack appropriate large data elements (point clouds and images) in binary
  const packedData = packBinaryJson(xvizJson, gltfBuilder, null, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  const {useAVSXVIZExtension} = options;
  if (useAVSXVIZExtension === true) {
    gltfBuilder.addExtension(XVIZ_GLTF_EXTENSION, packedData, {nopack: true});
  } else {
    gltfBuilder.addApplicationData('xviz', packedData, {nopack: true});
  }

  return gltfBuilder.encodeAsGLB(options);
}

export function writeBinaryXVIZtoFile(sink, directory, name, json, options) {
  const glbFileBuffer = encodeBinaryXVIZ(json, options);
  /* global Buffer */
  sink.writeSync(directory, `${name}.glb`, Buffer.from(glbFileBuffer), {flag: 'w'});
  return glbFileBuffer;
}
