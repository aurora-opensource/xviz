import {getXvizConfig} from '../config/xviz-config';
import {normalizeXvizPrimitive} from './parse-xviz-primitive';

export const PRIMITIVE_CAT = {
  LOOKAHEAD: 'lookAheads',
  FEATURE: 'features',
  LABEL: 'labels',
  POINTCLOUD: 'pointCloud',
  COMPONENT: 'components'
};

function createPrimitiveMap() {
  const result = {};
  for (const key in PRIMITIVE_CAT) {
    result[PRIMITIVE_CAT[key]] = [];
  }
  return result;
}

// Handle stream-sliced data, via the ETL flow.
export function parseXvizStream(data, convertPrimitive) {
  // data is an array of objects
  // Each object is [{primitives, variables, timestamp},...]
  // Each object represents a timestamp and array of objects

  const {primitives, variables, futures} = data[0];
  // At this point, we either have one or the other.
  // TODO(twojtasz): BUG: there is an assumption that
  // streamNames will be unique.  Need to put in a detection if
  // that is violated.
  if (primitives) {
    const streamName = Object.keys(primitives)[0];
    return data.map(datum =>
      parseStreamPrimitive(
        datum.primitives[streamName],
        streamName,
        datum.timestamp,
        convertPrimitive
      )
    );
  } else if (variables) {
    const streamName = Object.keys(variables)[0];
    return data.map(datum =>
      parseStreamVariable(datum.variables[streamName], streamName, datum.timestamp)
    );
  } else if (futures) {
    const streamName = Object.keys(futures)[0];
    return data.map(datum =>
      parseStreamFutures(datum.futures[streamName], streamName, datum.timestamp, convertPrimitive)
    );
  }

  return {};
}

/* eslint-disable max-depth, max-statements */

/* Processes an individual primitive time sample and converts the
 * data to UI elements.
 */
export function parseStreamPrimitive(objects, streamName, time, convertPrimitive) {
  const {observeObjects, preProcessPrimitive, PRIMITIVE_SETTINGS} = getXvizConfig();

  if (!Array.isArray(objects)) {
    return {};
  }

  observeObjects(streamName, objects, time);
  const primitiveMap = createPrimitiveMap();

  let category = null;
  // Primitives are an array of XVIZ objects
  for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
    const object = objects[objectIndex];

    // array of primitives
    if (object && Array.isArray(object)) {
      category = PRIMITIVE_CAT.LOOKAHEAD;
      primitiveMap[category].push([]);

      for (let j = 0; j < object.length; j++) {
        // Apply custom XVIZ pre processing to this primitive
        preProcessPrimitive({primitive: object[j], streamName, time});

        // process each primitive
        const primitive = normalizeXvizPrimitive(
          PRIMITIVE_SETTINGS,
          object[j],
          objectIndex,
          streamName,
          time,
          convertPrimitive
        );
        if (primitive) {
          primitiveMap[category][objectIndex].push(primitive);
        }
      }
    } else {
      // single primitive

      // Apply custom XVIZ postprocessing to this primitive
      preProcessPrimitive({primitive: object, streamName, time});

      // normalize primitive
      category = PRIMITIVE_SETTINGS[object.type].category;
      const primitive = normalizeXvizPrimitive(
        PRIMITIVE_SETTINGS,
        object,
        objectIndex,
        streamName,
        time,
        convertPrimitive
      );
      if (primitive) {
        primitiveMap[category].push(primitive);
      }
    }
  }

  primitiveMap.pointCloud = joinObjectPointCloudsToTypedArrays(primitiveMap.pointCloud);
  primitiveMap.time = time;

  return primitiveMap;
}

/* eslint-enable max-depth, max-statements */

/* Processes the futures and converts the
 * data to UI elements.
 */
export function parseStreamFutures(objects, streamName, time, convertPrimitive) {
  const {PRIMITIVE_SETTINGS} = getXvizConfig();
  const futures = [];
  // objects = array of objects
  // [{timestamp, primitives[]}, ...]

  // Futures are an array of array of primitives
  // TODO(twojtasz): objects indexes represent the
  //     represent an index into time, so they cannot be removed
  //     if empty.
  objects.forEach((object, objectIndex) => {
    const {primitives} = object;

    // TODO(twojtasz): only geometric primitives are supported
    // for now.  Text and point clouds are not handled
    // TODO(twojtasz): addThickness is temporary to use XVIZ thickness
    //                 on polygons.
    const future = primitives
      .map(primitive =>
        normalizeXvizPrimitive(
          PRIMITIVE_SETTINGS,
          primitive,
          objectIndex,
          streamName,
          time,
          convertPrimitive
        )
      )
      .filter(Boolean);

    futures.push(future);
  });

  return {
    time,
    lookAheads: futures
  };
}

/* Processes an individual variable time sample and converts the
 * data to UI elements.
 */
export function parseStreamVariable(objects, streamName, time) {
  const isVar = !Array.isArray(objects);
  if (!isVar) {
    return {};
  }

  let variable;
  const {timestamps, values} = objects;
  if (values.length === 1) {
    variable = values[0];
  } else {
    variable = values.map((v, i) => [timestamps[i], v]);
  }

  return {
    time,
    variable
  };
}

function getVertexCount(vertices) {
  if (vertices instanceof Float32Array) {
    return vertices.length / 3;
  } else {
    return vertices.length;
  }
}

// Joins a set of point clouds extracted from objects into a single point cloud
// generates typed arrays that can be displayed efficiently by deck.gl
function joinObjectPointCloudsToTypedArrays(objects) {
  if (objects.length === 0) {
    return null;
  }

  const DEFAULT_COLOR = [0, 0, 0, 255];

  let numInstances = 0;
  for (const object of objects) {
    numInstances += getVertexCount(object.vertices);
  }

  const positions = new Float32Array(numInstances * 3);
  const colors = new Uint8ClampedArray(numInstances * 4);

  // Store object ids to enable recoloring.
  // NOTE: Not a vertex attribute, ids are just efficiently stored as as 32 bit integers...
  const ids = new Uint32Array(numInstances);

  let i = 0;
  objects.forEach(object => {
    const vertexCount = getVertexCount(object.vertices);

    const isPositionFlattenedArray = object.vertices instanceof Float32Array;
    if (isPositionFlattenedArray) {
      positions.set(object.vertices, i * 3);
    }

    for (let j = 0; j < vertexCount; j++, i++) {
      ids[i] = object.id;

      if (!isPositionFlattenedArray) {
        const vertex = object.vertices[i];
        positions[i * 3 + 0] = vertex[0];
        positions[i * 3 + 1] = vertex[1];
        positions[i * 3 + 2] = vertex[2];
      }

      const color = object.color || DEFAULT_COLOR;
      colors[i * 4 + 0] = color[0];
      colors[i * 4 + 1] = color[1];
      colors[i * 4 + 2] = color[2];
      colors[i * 4 + 3] = color[3] || 255;
    }
  });

  return {
    type: objects[0].type,
    numInstances,
    positions,
    colors,
    ids
  };
}
