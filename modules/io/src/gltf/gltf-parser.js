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
/* global window, TextDecoder */
import '../common/text-encoding';
import {fetchFile} from '@loaders.gl/core';
import {getFullUri} from './gltf-utils/gltf-utils';
import {getGLTFAccessors, getGLTFAccessor} from './gltf-utils/gltf-attribute-utils';
import {KHR_DRACO_MESH_COMPRESSION, UBER_POINT_CLOUD_EXTENSION} from './gltf-constants';
import GLBParser from './glb-parser';
import GLTFPostProcessorOld from './gltf-post-processor-old';

const DEFAULT_OPTIONS = {
  fetchLinkedResources: true, // Fetch any linked .BIN buffers, decode base64
  fetch: fetchFile,
  decompress: false, // Decompress Draco compressed meshes (if DracoLoader available)
  DracoLoader: null,
  postProcess: true,
  createImages: false, // Create image objects
  log: console // eslint-disable-line
};

export class GLTFParser {
  async parse(gltf, options = {}) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    // Postpone decompressing/postprocessing to make sure we load any linked files first
    // TODO - is this really needed?
    this.parseSync(gltf, {...options, postProcess: false, decompress: false});

    // Load linked buffers asynchronously and decodes base64 buffers in parallel
    if (options.fetchLinkedResources) {
      await this._loadLinkedAssets(options);
    }

    if (options.decompress) {
      this._decompressMeshes(options);
    }

    if (options.postProcess) {
      const postProcessor = new GLTFPostProcessorOld();
      postProcessor.postProcess(this.gltf, this.glbParser, options);
    }

    return this.gltf;
  }

  // NOTE: The sync parser cannot handle linked assets or base64 encoded resources
  // gtlf - input can be arrayBuffer (GLB or UTF8 encoded JSON), string (JSON), or parsed JSON.
  parseSync(gltf, options = {}) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    // If binary is not starting with magic bytes, convert to string
    if (gltf instanceof ArrayBuffer && !GLBParser.isGLB(gltf, options)) {
      const textDecoder = new TextDecoder();
      gltf = textDecoder.decode(gltf);
    }

    // If string, try to parse as JSON
    if (typeof gltf === 'string') {
      gltf = JSON.parse(gltf);
    }

    if (gltf instanceof ArrayBuffer) {
      // Extract JSON from the GLB container
      this.glbParser = new GLBParser();
      this.gltf = this.glbParser.parseSync(gltf).json;
      this.json = this.gltf;
    } else {
      this.glbParser = null;
      this.gltf = gltf;
      this.json = gltf;
    }

    // TODO: we could handle base64 encoded files in the non-async path
    // await this._loadBuffersSync(options);

    // TODO: we could synchronously decode base64 encoded URIs in the non-async path
    // await this._loadLinkedAssetsSync(options);

    if (options.decompress) {
      this._decompressMeshes(options);
    }

    if (options.postProcess) {
      const postProcessor = new GLTFPostProcessorOld();
      postProcessor.postProcess(this.gltf, this.glbParser, options);
    }

    return this.gltf;
  }

  // Accessors

  getApplicationData(key) {
    if (this.json) {
      return this.json[key];
    } else if (this.glbParser) {
      return this.glbParser.getApplicationData(key);
    }

    return null;
  }

  getExtraData(key) {
    // TODO - Data is already unpacked by GLBParser
    const extras = this.json.extras || {};
    return extras[key];
  }

  getExtension(extensionName) {
    const isExtension = this.getUsedExtensions().find(name => name === extensionName);
    const extensions = this.json.extensions || {};
    return isExtension ? extensions[extensionName] || true : null;
  }

  getRequiredExtension(extensionName) {
    const isRequired = this.getRequiredExtensions().find(name => name === extensionName);
    return isRequired ? this.getExtension(extensionName) : null;
  }

  getRequiredExtensions() {
    return this.json.extensionsRequired || [];
  }

  getUsedExtensions() {
    return this.json.extensionsUsed || [];
  }

  getScene(index) {
    return this._get('scenes', index);
  }

  getNode(index) {
    return this._get('nodes', index);
  }

  getSkin(index) {
    return this._get('skins', index);
  }

  getMesh(index) {
    return this._get('meshes', index);
  }

  getMaterial(index) {
    return this._get('materials', index);
  }

  getAccessor(index) {
    return this._get('accessors', index);
  }

  getCamera(index) {
    return null; // TODO: fix this
  }

  getTexture(index) {
    return this._get('textures', index);
  }

  getSampler(index) {
    return this._get('samplers', index);
  }

  getImage(index) {
    return this._get('images', index);
  }

  getBufferView(index) {
    return this._get('bufferViews', index);
  }

  getBuffer(index) {
    return this._get('buffers', index);
  }

  // PARSING HELPERS

  _get(array, index) {
    // check if already resolved
    if (typeof index === 'object') {
      return index;
    }
    const object = this.gltf[array] && this.gltf[array][index];
    if (!object) {
      console.warn(`glTF file error: Could not find ${array}[${index}]`); // eslint-disable-line
    }
    return object;
  }

  // PARSING HELPERS

  // Load linked assets
  async _loadLinkedAssets(options) {
    return await Promise.all(this.gltf.buffers.map(buffer => this._loadBuffer(buffer, options)));
  }

  async _loadBuffer(buffer, options) {
    // NOTE: options.uri is not correctly passed, however this class is deprecated...
    if (buffer.uri && options.uri) {
      const fetch = options.fetch || window.fetch;
      const uri = getFullUri(buffer.uri, options.uri);
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      buffer.data = arrayBuffer;
      buffer.uri = null;
    }
  }

  // POST PROCESSING

  _decompressMeshes(options) {
    // We have a "soft dependency" on Draco to avoid bundling it when not needed
    // DracoEncoder needs to be imported and supplied by app
    if (!options.DracoLoader || !options.decompress) {
      return;
    }

    for (const mesh of this.gltf.meshes || []) {
      // Decompress all the primitives in a mesh
      for (const primitive of mesh.primitives) {
        this._decompressKhronosDracoPrimitive(primitive, options);
        this._decompressUberDracoPrimitive(primitive, options);
        if (!primitive.attributes || Object.keys(primitive.attributes).length === 0) {
          throw new Error('Empty glTF primitive: decompression failure?');
        }
      }
    }

    // We have now decompressed all primitives, we can remove the top-level extensions
    this._removeExtension(KHR_DRACO_MESH_COMPRESSION);
    this._removeExtension(UBER_POINT_CLOUD_EXTENSION);
  }

  // Unpacks one mesh primitive and removes the extension from the primitive
  // TODO - Implement fallback behavior per KHR_DRACO_MESH_COMPRESSION spec
  // TODO - Decompression could be threaded: Use DracoWorkerLoader?
  //
  // eslint-disable-next-line max-len
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
  _decompressKhronosDracoPrimitive(primitive, options) {
    const compressedMesh = primitive.extensions && primitive.extensions[KHR_DRACO_MESH_COMPRESSION];
    if (!compressedMesh) {
      return;
    }

    // Extension will be processed, delete it
    delete primitive.extensions[KHR_DRACO_MESH_COMPRESSION];

    const buffer = this._getBufferViewArray(compressedMesh.bufferView);
    const decodedData = options.DracoLoader.parseSync(buffer);
    primitive.attributes = getGLTFAccessors(decodedData.attributes);
    if (decodedData.indices) {
      primitive.indices = getGLTFAccessor(decodedData.indices);
    }
  }

  // Unpacks one mesh primitive and removes the extension from the primitive
  _decompressUberDracoPrimitive(primitive, options) {
    const compressedMesh = primitive.extensions && primitive.extensions[UBER_POINT_CLOUD_EXTENSION];
    if (!compressedMesh) {
      return;
    }

    if (primitive.mode !== 0) {
      throw new Error(UBER_POINT_CLOUD_EXTENSION);
    }

    // Extension will be processed, delete it
    delete primitive.extensions[UBER_POINT_CLOUD_EXTENSION];

    const buffer = this._getBufferViewArray(compressedMesh.bufferView);
    const decodedData = options.DracoLoader.parseSync(buffer);
    primitive.attributes = decodedData.attributes;
  }

  _getBufferViewArray(bufferViewIndex) {
    const bufferView = this.gltf.bufferViews[bufferViewIndex];
    if (this.glbParser) {
      return this.glbParser.getBufferView(bufferView);
    }

    const buffer = this.gltf.buffers[bufferView.buffer].data;
    const byteOffset = bufferView.byteOffset || 0;
    return new Uint8Array(buffer, byteOffset, bufferView.byteLength);
  }

  // Removes an extension from the top-level list
  _removeExtension(extensionName) {
    if (this.json.extensionsRequired) {
      this._removeStringFromArray(this.json.extensionsRequired, extensionName);
    }
    if (this.json.extensionsUsed) {
      this._removeStringFromArray(this.json.extensionsUsed, extensionName);
    }
    if (this.json.extensions) {
      delete this.json.extensions[extensionName];
    }
  }

  _removeStringFromArray(array, string) {
    let found = true;
    while (found) {
      const index = array.indexOf(string);
      if (index > -1) {
        array.splice(index, 1);
      } else {
        found = false;
      }
    }
  }
}
