import {encodeGLB} from '../glb-writer';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

export function encodeBinaryXVIZ(inputJson, options) {
  // For better compabitility with glTF, we put all XVIZ data in a subfield.
  const json = {
    xviz: inputJson
  };

  const newOptions = Object.assign({magic: MAGIC_XVIZ}, options);

  return encodeGLB(json, newOptions);
}

export function writeBinaryXVIZtoFile(filePath, json, options) {
  const glbFileBuffer = encodeBinaryXVIZ(json, options);
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
