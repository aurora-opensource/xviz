const PrimitiveTypes = [
  'circles',
  'images',
  'points',
  'polygons',
  'polylines',
  'stadiums',
  'texts'
];

/**
 * Primitives in v2 are a map with the 'type' as the key.
 * This function validates the type and returns underlying array
 *
 */
export function getPrimitiveData(primitiveObject) {
  // v1
  if (primitiveObject.type) {
    return {type: primitiveObject.type, primitiveObject};
  }

  // v2
  const keys = Object.keys(primitiveObject);

  for (const type of keys) {
    if (PrimitiveTypes.includes(type)) {
      // Types in v2 are the plural form, but lookup in xviz-primitives-2.js
      // uses singular, ie points -> point
      const singularType = type.slice(0, -1);
      return {type: singularType, primitives: primitiveObject[type]};
    }
  }

  return null;
}
