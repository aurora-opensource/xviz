import {parseGLB, isGLB} from '../glb-loader';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

export function parseBinaryXVIZ(arrayBuffer) {
  const json = parseGLB(arrayBuffer, {magic: MAGIC_XVIZ});
  return json.xviz;
}

export function isBinaryXVIZ(arrayBuffer) {
  return isGLB(arrayBuffer, {magic: MAGIC_XVIZ});
}