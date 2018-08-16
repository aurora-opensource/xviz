export function padTo4Bytes(byteLength) {
  return (byteLength + 3) & ~3;
}
