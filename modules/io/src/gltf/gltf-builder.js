// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {getBinaryImageMetadata} from '@loaders.gl/images';
import {assert} from './assert';
import {KHR_DRACO_MESH_COMPRESSION, UBER_POINT_CLOUD_EXTENSION} from './gltf-constants';
import GLBBuilder from './glb-builder';
import {packBinaryJson} from '../writers/xviz-pack-binary';

export class GLTFBuilder extends GLBBuilder {
  constructor(options = {}) {
    super(options);

    // Soft dependency on DRACO, app needs to import and supply these
    this.DracoWriter = options.DracoWriter;
    this.DracoLoader = options.DracoLoader;
  }

  // NOTE: encode() inherited from GLBBuilder

  // TODO - support encoding to non-GLB versions of glTF format
  // Encode as a textual JSON file with binary data in base64 data URLs.
  // encodeAsDataURLs(options)
  // Encode as a JSON with all images (and buffers?) in separate binary files
  // encodeAsSeparateFiles(options)

  // Add an extra application-defined key to the top-level data structure
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addApplicationData(key, data, packOptions = {}) {
    const jsonData = packOptions.nopack ? data : packBinaryJson(data, this, null, packOptions);
    this.json[key] = jsonData;
    return this;
  }

  // `extras` - Standard GLTF field for storing application specific data
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtraData(key, data, packOptions = {}) {
    const packedJson = packOptions.nopack ? data : packBinaryJson(data, this, null, packOptions);
    this.json.extras = this.json.extras || {};
    this.json.extras[key] = packedJson;
    return this;
  }

  // Add to standard GLTF top level extension object, mark as used
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = packOptions.nopack ? data : packBinaryJson(data, this, null, packOptions);
    this.json.extensions = this.json.extensions || {};
    this.json.extensions[extensionName] = packedJson;
    this.registerUsedExtension(extensionName);
    return this;
  }

  // Standard GLTF top level extension object, mark as used and required
  // By default packs JSON by extracting binary data and replacing it with JSON pointers
  addRequiredExtension(extensionName, data, packOptions = {}) {
    assert(data);
    const packedJson = packOptions.nopack ? data : packBinaryJson(data, this, null, packOptions);
    this.addExtension(extensionName, packedJson);
    this.registerRequiredExtension(extensionName);
    return this;
  }

  // Add extensionName to list of used extensions
  registerUsedExtension(extensionName) {
    this.json.extensionsUsed = this.json.extensionsUsed || [];
    if (!this.json.extensionsUsed.find(ext => ext === extensionName)) {
      this.json.extensionsUsed.push(extensionName);
    }
  }

  // Add extensionName to list of required extensions
  registerRequiredExtension(extensionName) {
    this.registerUsedExtension(extensionName);
    this.json.extensionsRequired = this.json.extensionsRequired || [];
    if (!this.json.extensionsRequired.find(ext => ext === extensionName)) {
      this.json.extensionsRequired.push(extensionName);
    }
  }

  // mode:
  // POINTS:  0x0000,
  // LINES: 0x0001,
  // LINE_LOOP: 0x0002,
  // LINE_STRIP:  0x0003,
  // TRIANGLES: 0x0004,
  // TRIANGLE_STRIP:  0x0005,
  // TRIANGLE_FAN:  0x0006,

  addMesh(attributes, indices, mode = 4) {
    const accessors = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessors,
          indices,
          mode
        }
      ]
    };

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addPointCloud(attributes) {
    const accessorIndices = this._addAttributes(attributes);

    const glTFMesh = {
      primitives: [
        {
          attributes: accessorIndices,
          mode: 0 // GL.POINTS
        }
      ]
    };

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // eslint-disable-next-line max-len
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
  // Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
  addCompressedMesh(attributes, indices, mode = 4) {
    if (!this.DracoWriter || !this.DracoLoader) {
      throw new Error('DracoWriter/DracoLoader not available');
    }

    // Since we do not add fallback data
    this.registerRequiredExtension(KHR_DRACO_MESH_COMPRESSION);

    const compressedData = this.DracoWriter.encodeSync({attributes});

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const decodedData = this.DracoLoader.parseSync({attributes});
    const fauxAccessors = this._addFauxAttributes(decodedData.attributes);

    const bufferViewIndex = this.addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: fauxAccessors, // TODO - verify with spec
          mode, // GL.POINTS
          extensions: {
            [KHR_DRACO_MESH_COMPRESSION]: {
              bufferView: bufferViewIndex,
              attributes: fauxAccessors // TODO - verify with spec
            }
          }
        }
      ]
    };

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  addCompressedPointCloud(attributes) {
    if (!this.DracoWriter || !this.DracoLoader) {
      throw new Error('DracoWriter/DracoLoader not available');
    }

    attributes.mode = 0;
    const compressedData = this.DracoWriter.encodeSync(attributes, {pointcloud: true});

    const bufferViewIndex = this.addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: {}, // This will be populated after decompression
          mode: 0, // GL.POINTS
          extensions: {
            [UBER_POINT_CLOUD_EXTENSION]: {
              bufferView: bufferViewIndex
            }
          }
        }
      ]
    };

    this.registerRequiredExtension(UBER_POINT_CLOUD_EXTENSION);

    this.json.meshes = this.json.meshes || [];
    this.json.meshes.push(glTFMesh);
    return this.json.meshes.length - 1;
  }

  // Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
  // Buffer will be copied into BIN chunk during "pack"
  // Currently encodes as glTF image
  addImage(imageData) {
    const bufferViewIndex = this.addBufferView(imageData);

    // Get the properties of the image to add as metadata.
    const sizeAndType = getBinaryImageMetadata(imageData) || {};
    if (sizeAndType) {
      // width and height are non-spec fields
      const {mimeType, width, height} = sizeAndType;
      this.json.images.push({
        bufferView: bufferViewIndex,
        mimeType,
        width,
        height
      });
    } else {
      // TODO: Spec violation, if we are using a bufferView, mimeType must be defined:
      //   https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#images
      //   "a reference to a bufferView; in that case mimeType must be defined."
      this.json.images.push({
        bufferView: bufferViewIndex
      });
    }

    return this.json.images.length - 1;
  }
}
