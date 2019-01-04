import {Vector3} from 'math.gl';

import {getXVIZConfig} from '../config/xviz-config';

// filter out identical vertices from a list
// Ensure points at least a certain distance away from each other
// This reduces data size and works around an issue in the deck.gl PathLayer
export function filterVertices(vertices) {
  // TODO - Can't handle flat arrays
  if (!Array.isArray(vertices)) {
    return vertices;
  }

  const THRESHOLD = getXVIZConfig().pathDistanceThreshold;

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
