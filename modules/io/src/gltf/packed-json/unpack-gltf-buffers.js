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
import {assert} from '../assert';
import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';

export default function unpackGLBBuffers(arrayBuffer, json, binaryByteOffset) {
  // TODO - really inefficient, should just use the offset into the original array buffer
  if (binaryByteOffset) {
    arrayBuffer = getArrayBufferAtOffset(arrayBuffer, binaryByteOffset);
  }

  const bufferViews = json.bufferViews || [];

  for (let i = 0; i < bufferViews.length; ++i) {
    const bufferView = bufferViews[i];
    assert(bufferView.byteLength >= 0);
  }

  return {
    // TODO: delete unpackAccessors and use buffer views only?
    accessors: unpackAccessors(arrayBuffer, bufferViews, json),
    images: unpackImages(arrayBuffer, bufferViews, json)
  };
}

function unpackAccessors(arrayBuffer, bufferViews, json) {
  // unpack accessors
  const accessors = json.accessors || [];

  const accessorBuffers = [];

  for (let i = 0; i < accessors.length; ++i) {
    const accessor = accessors[i];
    assert(accessor);

    const bufferView = bufferViews[accessor.bufferView];
    // Draco encoded meshes don't have bufferView in accessor
    if (bufferView) {
      // Create a new typed array as a view into the combined buffer
      const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
      const array = new ArrayType(arrayBuffer, bufferView.byteOffset, length);
      // Store the metadata on the array (e.g. needed to determine number of components per element)
      array.accessor = accessor;
      accessorBuffers.push(array);
    }
  }

  return accessorBuffers;
}

function unpackImages(arrayBuffer, bufferViews, json) {
  // unpack images
  const images = json.images || [];

  const imageBuffers = [];

  for (let i = 0; i < images.length; ++i) {
    const image = images[i];
    assert(image);

    const bufferView = bufferViews[image.bufferView];
    assert(bufferView);

    // Create a new typed array as a view into the combined buffer
    const array = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);
    // Store the metadata on the array (e.g. needed to determine number of components per element)
    array.imate = image;
    imageBuffers.push(array);
  }

  return imageBuffers;
}

// Helper methods

// json.accessors = json.accessors || [];
// json.bufferViews = json.bufferViews || [];

// Creates a new ArrayBuffer starting at the offset, containing all remaining bytes
// TODO - should not be needed, see above
function getArrayBufferAtOffset(arrayBuffer, byteOffset) {
  const length = arrayBuffer.byteLength - byteOffset;
  const binaryBuffer = new ArrayBuffer(length);
  const sourceArray = new Uint8Array(arrayBuffer);
  const binaryArray = new Uint8Array(binaryBuffer);
  for (let i = 0; i < length; i++) {
    binaryArray[i] = sourceArray[byteOffset + i];
  }
  return binaryBuffer;
}
