import base64js from 'base64-js';

// Recursively walk object performing the following conversions
// - primitives with typed array fields are turned into arrays
// - primtives of type image have the data turned into a base64 string
/* eslint-disable complexity */
export function xvizConvertJson(object, keyName) {
  if (Array.isArray(object)) {
    return object.map(element => xvizConvertJson(element, keyName));
  }

  // Typed arrays become normal arrays
  // TODO: no way to know if this should be 3 or 4
  if (ArrayBuffer.isView(object)) {
    // Return normal arrays
    if (!(keyName === 'vertices' || keyName === 'points')) {
      return Array.from(object);
    }

    // For primitives with key's 'vertices', we force nested arrays.
    // TODO(twojtasz): Support flat arrays
    const length = object.length;
    if (length % 3 !== 0) {
      throw new Error('TypeArray conversion failure. The array is expect to be divisible by 3');
    }

    // Construct points from flattened array
    const newObject = [];
    const count = length / 3;
    for (let i = 0; i < count; i++) {
      newObject.push(Array.from(object.slice(i * 3, i * 3 + 3)));
    }
    return newObject;
  }

  if (object !== null && typeof object === 'object') {
    // Handle XVIZ Image Primitive
    const properties = Object.keys(object);
    if (properties.includes('data') && keyName === 'images') {
      return {
        ...object,
        data: base64js.fromByteArray(object.data)
      };
    }

    // Handle all other objects
    const newObject = {};
    for (const key in object) {
      newObject[key] = xvizConvertJson(object[key], key, keyName);
    }
    return newObject;
  }

  return object;
}
/* eslint-enable complexity */
