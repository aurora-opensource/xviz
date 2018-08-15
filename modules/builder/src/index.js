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

// LOADERS

export {loadUri} from './loader-utils/load-uri.js';

export {parseBinaryXVIZ} from './xviz-loader/xviz-binary-loader';
export {encodeBinaryXVIZ} from './xviz-loader/xviz-binary-writer';
export {default as XVIZWriter} from './xviz-loader/xviz-writer';
export {default as XVIZBuilder} from './xviz-loader/xviz-builder';
export {default as XVIZMetadataBuilder} from './xviz-loader/xviz-metadata-builder';

export {parseGLB} from './glb-loader/glb-loader';
export {encodeGLB} from './glb-loader/glb-writer';

// Experimental exports, exposes internals
export {default as _GLBDecoder} from './glb-loader/glb-decoder';
export {default as _GLBEncoder} from './glb-loader/glb-encoder';
export {default as _GLBBufferPacker} from './glb-loader/glb-buffer-packer';
export {default as _unpackGLBBuffers} from './glb-loader/unpack-glb-buffers';
export {
  packJsonArrays as _packJsonArrays,
  unpackJsonArrays as _unpackJsonArrays
} from './glb-loader/pack-json-arrays';
