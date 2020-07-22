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
/* eslint-disable camelcase, max-statements */
import {
  copyPaddedStringToDataView,
  copyPaddedArrayBufferToDataView
} from '@loaders.gl/loader-utils';

const MAGIC_glTF = 0x46546c67; // glTF in ASCII
const MAGIC_JSON = 0x4e4f534a; // JSON in ASCII
const MAGIC_BIN = 0x004e4942; // BIN\0 in ASCII

const LE = true; // Binary GLTF is little endian.

// Encode the full GLB buffer with header etc
// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#
// glb-file-format-specification
export default function encodeGLBSync(glb, dataView, byteOffset = 0, options = {}) {
  const {magic = MAGIC_glTF, version = 2, json = {}, binary} = glb;

  const byteOffsetStart = byteOffset;

  // Write GLB Header
  if (dataView) {
    dataView.setUint32(byteOffset + 0, magic, LE); // Magic number (the ASCII string 'glTF').
    dataView.setUint32(byteOffset + 4, version, LE); // Version 2 of binary glTF container format uint32
    dataView.setUint32(byteOffset + 8, 0, LE); // Total byte length of generated file (uint32), will be set last
  }
  const byteOffsetFileLength = byteOffset + 8;
  byteOffset += 12; // GLB_FILE_HEADER_SIZE

  // Write the JSON chunk header
  const byteOffsetJsonHeader = byteOffset;
  if (dataView) {
    dataView.setUint32(byteOffset + 0, 0, LE); // Byte length of json chunk (will be written later)
    dataView.setUint32(byteOffset + 4, MAGIC_JSON, LE); // Chunk type
  }
  byteOffset += 8; // GLB_CHUNK_HEADER_SIZE

  // Write the JSON chunk
  const jsonString = JSON.stringify(json);
  byteOffset = copyPaddedStringToDataView(dataView, byteOffset, jsonString, 4);

  // Now we know the JSON chunk length so we can write it.
  if (dataView) {
    const jsonByteLength = byteOffset - byteOffsetJsonHeader - 8; // GLB_CHUNK_HEADER_SIZE
    dataView.setUint32(byteOffsetJsonHeader + 0, jsonByteLength, LE); // Byte length of json chunk (uint32)
  }

  // Write the BIN chunk if present. The BIN chunk is optional.
  if (binary) {
    const byteOffsetBinHeader = byteOffset;

    // Write the BIN chunk header
    if (dataView) {
      dataView.setUint32(byteOffset + 0, 0, LE); // Byte length BIN (uint32)
      dataView.setUint32(byteOffset + 4, MAGIC_BIN, LE); // Chunk type
    }
    byteOffset += 8; // GLB_CHUNK_HEADER_SIZE

    byteOffset = copyPaddedArrayBufferToDataView(dataView, byteOffset, binary, 4);

    // Now we know the BIN chunk length so we can write it.
    if (dataView) {
      const binByteLength = byteOffset - byteOffsetBinHeader - 8; // GLB_CHUNK_HEADER_SIZE
      dataView.setUint32(byteOffsetBinHeader + 0, binByteLength, LE); // Byte length BIN (uint32)
    }
  }

  // Now we know the glb file length so we can write it.
  if (dataView) {
    const fileByteLength = byteOffset - byteOffsetStart;
    dataView.setUint32(byteOffsetFileLength, fileByteLength, LE); // Total byte length of generated file (uint32)
  }

  return byteOffset;
}
