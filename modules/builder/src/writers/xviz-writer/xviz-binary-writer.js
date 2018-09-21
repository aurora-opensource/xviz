import {GLTFBuilder} from '@loaders.gl/gltf';
import {toBuffer} from '@loaders.gl/core';

export function encodeBinaryXVIZ(xvizJson, options) {
  const gltfBuilder = new GLTFBuilder();

  // TODO/ib - the following options would break backwards compatibility
  // gltfBuilder.addExtraData('xviz', xvizJson, options)
  // gltfBuilder.addExtension('UBER_xviz', xvizJson, options);
  // gltfBuilder.addRequiredExtension('UBER_xviz', xvizJson, options);

  // As permitted by glTF, we put all XVIZ data in a top-level subfield.
  gltfBuilder.addApplicationData('xviz', xvizJson, options);

  return gltfBuilder.encodeAsGLB(options);
}

export function writeBinaryXVIZtoFile(sink, directory, name, json, options) {
  const glbFileBuffer = encodeBinaryXVIZ(json, options);
  sink.writeSync(directory, `${name}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  return glbFileBuffer;
}
