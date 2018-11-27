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

export const PRIMITIVE_CAT = {
  LOOKAHEAD: 'lookAheads',
  FEATURE: 'features',
  LABEL: 'labels',
  POINTCLOUD: 'pointCloud',
  IMAGE: 'images',
  COMPONENT: 'components' // TODO(twojtasz): remove when v1 support is removed
};

// eslint-disable-next-line max-params
export function normalizeXVIZPrimitive(
  PRIMITIVE_PROCCESSOR,
  primitive,
  objectIndex,
  streamName,
  type,
  time,
  postProcessPrimitive
) {
  // as normalizeXVIZPrimitive is called for each primitive of every frame
  // it is intentional to mutate the primitive in place
  // to avoid frequent allocate/discard and improve performance

  // Type could come set (v2 metadata or object, or v1 inline)
  const primitiveType = primitive.type || type;

  const {
    // line2d, polygon2d
    vertices,
    // circle2d
    center
  } = primitive;

  const {enableZOffset, validate, normalize} = PRIMITIVE_PROCCESSOR[primitiveType];

  // Apply a small offset to 2d geometries to battle z fighting
  if (enableZOffset) {
    const zOffset = objectIndex * 1e-6;
    if (vertices) {
      // TODO(twojtasz): this is pretty bad for memory, backend must
      // set all 3 values otherwise we allocate and cause heavy GC
      // TODO - this looks like it could be handled with a model matrix?
      for (let i = 0; i < vertices.length; i++) {
        // Flatten the data for now
        vertices[i][2] = zOffset;
      }
    }
    if (center && center.length === 2) {
      center[2] = zOffset;
    }
  }

  // add 'type' if not present at root level of primitive
  if (primitiveType) {
    primitive.type = primitiveType;
  }

  // validate
  if (!validate(primitive, streamName, time)) {
    return null;
  }

  // process
  if (normalize) {
    normalize(primitive);
  }

  // post process
  if (postProcessPrimitive) {
    postProcessPrimitive(primitive);
  }

  return primitive;
}
