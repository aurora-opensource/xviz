import {GLBParser} from 'loaders.gl';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

export function parseBinaryXVIZ(arrayBuffer) {
  const json = new GLBParser(arrayBuffer).parse({
    magic: MAGIC_XVIZ,
    jsonField: 'xviz'
  });
  return json.xviz;
}
