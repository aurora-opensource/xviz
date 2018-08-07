export function padTo4Bytes(x) {
  return (x + 3) & ~3;
}
