import {GLTFParser} from '@loaders.gl/gltf';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII
const MAGIC_GLTF = 0x676c5446; // glTF in Big-Endian ASCII
const BE = false; // Magic needs to be written as BE

export function parseBinaryXVIZ(arrayBuffer) {
  const gltfParser = new GLTFParser(arrayBuffer);
  gltfParser.parse({magic: MAGIC_XVIZ});

  // TODO/ib - the following options would break backwards compatibility
  // return gltfParser.getExtras('xviz')
  // return gltfParser.getExtension('UBER_xviz');

  // TODO/ib - Fix when loaders.gl API is fixed
  return gltfParser.getApplicationData('xviz');
}

export function isBinaryXVIZ(arrayBuffer) {
  const isArrayBuffer = arrayBuffer instanceof ArrayBuffer;
  return isArrayBuffer && isGLB(arrayBuffer, {magic: MAGIC_XVIZ});
}

// TODO - Replace with GLBParser.isGLB()
function isGLB(glbArrayBuffer, options = {}) {
  const {magic = MAGIC_GLTF} = options;

  // GLB Header
  const dataView = new DataView(glbArrayBuffer);
  const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').

  return magic1 === magic || magic1 === MAGIC_GLTF;
}
