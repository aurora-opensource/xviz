import GLBContainer from './helpers/glb-container';
import GLBBufferPacker from './helpers/glb-buffer-packer';
import {packJsonArrays} from './helpers/pack-json-arrays';

export function encodeGLB(inputJson, options) {
  const bufferPacker = new GLBBufferPacker();
  const glbJson = packJsonArrays(inputJson, bufferPacker, options);
  // TODO - avoid double array buffer creation
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers();

  Object.assign(glbJson, jsonDescriptors);
  return GLBContainer.createGlbBuffer(glbJson, arrayBuffer, options);
}

export function writeGLBtoFile(filePath, json, options) {
  const glbFileBuffer = encodeGLB(json, options);
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  // console.log(`Wrote ${filePath}.glb`);
  return glbFileBuffer;
}

// Helper methods

// Convert (copy) ArrayBuffer to Buffer
function toBuffer(arrayBuffer) {
  /* global Buffer */
  const buffer = new Buffer(arrayBuffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}
