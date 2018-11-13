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

import {Vector3} from 'math.gl';

import {getXVIZSettings} from '../config/xviz-config';

// filter out identical vertices from a list
// Ensure points at least a certain distance away from each other
// This reduces data size and works around an issue in the deck.gl PathLayer
export function filterVertices(vertices) {
  // TODO - Can't handle flat arrays
  if (!Array.isArray(vertices)) {
    return vertices;
  }

  const THRESHOLD = getXVIZSettings().pathDistanceThreshold;

  const newVertices = [];
  let lastEmittedVertex = -1;
  for (let i = 0; i < vertices.length; ++i) {
    const shouldAddVert =
      lastEmittedVertex === -1 ||
      new Vector3(vertices[lastEmittedVertex]).distance(vertices[i]) > THRESHOLD;
    if (shouldAddVert) {
      newVertices.push(vertices[i]);
      lastEmittedVertex = i;
    }
  }

  // Make sure we always emitted the last vertex
  if (lastEmittedVertex !== vertices.length - 1) {
    newVertices.pop();
    newVertices.push(vertices[vertices.length - 1]);
  }

  return newVertices;
}
