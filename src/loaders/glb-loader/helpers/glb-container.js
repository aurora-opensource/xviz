/* eslint-disable camelcase, max-statements */
import {padTo4Bytes} from '../utils/utils';
import {TextEncoder, TextDecoder} from '../utils/text-encode-decode'; // Node.js polyfills
import assert from '../../../utils/assert';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
export default class GLBContainer {
  static createGlbBuffer(json, binChunk, options = {}) {
    const {magic = MAGIC_glTF} = options;

    if (!json.buffers) {
      json.buffers = [
        {
          byteLength: binChunk.byteLength
        }
      ];
    }

    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes

    const jsonChunk = convertObjectToJsonChunk(json);
    // As body is 4-byte aligned, the scene length must be padded to have a multiple of 4.
    const jsonChunkLength = padTo4Bytes(jsonChunk.byteLength);

    const binChunkOffset = jsonChunkLength + jsonChunkOffset;
    const fileLength = binChunkOffset + GLB_CHUNK_HEADER_SIZE + padTo4Bytes(binChunk.byteLength);

    // Length is know, we can create the GLB memory buffer!
    const glbArrayBuffer = new ArrayBuffer(fileLength);
    const dataView = new DataView(glbArrayBuffer);

    // GLB Header
    dataView.setUint32(0, magic, BE); // Magic number (the ASCII string 'glTF').
    dataView.setUint32(4, 2, LE); // Version 2 of binary glTF container format uint32
    dataView.setUint32(8, fileLength, LE); // Total byte length of generated file (uint32)

    // Write the JSON chunk
    dataView.setUint32(12, jsonChunk.byteLength, LE); // Byte length of json chunk (uint32)
    dataView.setUint32(16, 0, LE); // Chunk format as uint32 (JSON is 0)
    copyArrayBuffer(glbArrayBuffer, jsonChunk, jsonChunkOffset);

    // TODO - Add spaces as padding to ensure scene is a multiple of 4 bytes.
    // for (let i = jsonChunkLength + 20; i < binChunkOffset; ++i) {
    //   glbFileArray[i] = 0x20;
    // }

    // Write the BIN chunk
    const binChunkLengthPadded = padTo4Bytes(binChunk.byteLength);
    dataView.setUint32(binChunkOffset + 0, binChunkLengthPadded, LE); // Byte length of BIN chunk (uint32)
    dataView.setUint32(binChunkOffset + 4, 1, LE); // Chunk format as uint32 (BIN is 1)
    copyArrayBuffer(glbArrayBuffer, binChunk, binChunkOffset + GLB_CHUNK_HEADER_SIZE);

    return glbArrayBuffer;
  }

  static parseGlbBuffer(glbArrayBuffer, options = {}) {
    const {magic = MAGIC_glTF} = options;

    // GLB Header
    const dataView = new DataView(glbArrayBuffer);
    const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').
    const version = dataView.getUint32(4, LE); // Version 2 of binary glTF container format
    const fileLength = dataView.getUint32(8, LE); // Total byte length of generated file
    assert(magic1 === magic || magic1 === MAGIC_glTF);
    assert(version === 2, 'Only .glb v2 supported');
    assert(fileLength > 20);

    // Write the JSON chunk
    const jsonChunkLength = dataView.getUint32(12, LE); // Byte length of json chunk
    const jsonChunkFormat = dataView.getUint32(16, LE); // Chunk format as uint32 (JSON is 0)
    assert(jsonChunkFormat === 0);

    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes
    const jsonChunk = new Uint8Array(glbArrayBuffer, jsonChunkOffset, jsonChunkLength);
    const jsonString = decodeJson(jsonChunk);
    const json = JSON.parse(jsonString);

    const binaryByteOffset = jsonChunkOffset + padTo4Bytes(jsonChunkLength) + GLB_CHUNK_HEADER_SIZE;

    return {json, binaryByteOffset};
  }
}

/* Creates a new Uint8Array based on two different ArrayBuffers
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
function copyArrayBuffer(
  targetBuffer,
  sourceBuffer,
  byteOffset,
  byteLength = sourceBuffer.byteLength
) {
  const targetArray = new Uint8Array(targetBuffer, byteOffset, byteLength);
  const sourceArray = new Uint8Array(sourceBuffer);
  targetArray.set(sourceArray);
  return targetBuffer;
}

function convertObjectToJsonChunk(json) {
  const jsonChunkString = JSON.stringify(json);
  const textEncoder = new TextEncoder('utf8');
  return textEncoder.encode(jsonChunkString);
}

function decodeJson(textArray) {
  const textDecoder = new TextDecoder('utf8');
  return textDecoder.decode(textArray);
}
