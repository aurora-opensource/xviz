import GLBContainer from './helpers/glb-container';
import unpackGLBBuffers from './helpers/unpack-glb-buffers';
import {unpackJsonArrays} from './helpers/pack-json-arrays';

export function parseGLB(arrayBuffer, options = {}) {
  const {json, binaryByteOffset} = GLBContainer.parseGlbBuffer(arrayBuffer, options);
  const unpackedBuffers = unpackGLBBuffers(arrayBuffer, json, binaryByteOffset);
  return unpackJsonArrays(json, unpackedBuffers);
}
