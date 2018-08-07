// TODO - New accessor/buffer descriptor format that is more compact than glTFs

const FORMAT_CHAR_TO_ARRAY_TYPE = {
  e: Float64Array,
  f: Float32Array,
  i: Int32Array,
  I: Uint32Array,
  h: Int16Array,
  H: Uint16Array,
  b: Int8Array,
  B: Uint8Array
};

function getFormatCharFromArray(array) {
  switch (array.constructor) {
    case Float64Array:
      return 'e';
    case Float32Array:
      return 'f';
    case Int32Array:
      return 'i';
    case Uint32Array:
      return 'I';
    case Int16Array:
      return 'h';
    case Uint16Array:
      return 'H';
    case Int8Array:
      return 'b';
    case Uint8Array:
      return 'B';
    default:
      return null;
  }
}

export function encodeXVIZAccessSpecifier({array, byteOffset, components = 1}) {
  return [byteOffset, array.byteLengh, getFormatCharFromArray(array), components];
}

export function decodeXVIZAccessSpecifier([
  byteOffset,
  byteLength,
  typeChar = 'f',
  components = 1
]) {
  const ArrayType = FORMAT_CHAR_TO_ARRAY_TYPE[typeChar];
  return {ArrayType};
}
