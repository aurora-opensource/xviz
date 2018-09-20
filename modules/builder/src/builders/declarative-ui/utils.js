export function snakeToCamel(s) {
  return s.replace(/_\w/g, m => m[1].toUpperCase());
}
