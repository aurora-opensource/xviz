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

import {getXVIZConfig} from '../config/xviz-config';
import {PRIMITIVE_CAT, normalizeXVIZPrimitive} from './parse-xviz-primitive';
import XVIZObject from '../objects/xviz-object';
import {isMainThread} from '../utils/globals';
import {getPrimitiveData} from './xviz-v2-common';

import XVIZPrimitiveSettingsV1 from './xviz-primitives-v1';
import XVIZPrimitiveSettingsV2 from './xviz-primitives-v2';

function createPrimitiveMap() {
  const result = {};
  for (const key in PRIMITIVE_CAT) {
    result[PRIMITIVE_CAT[key]] = [];
  }
  return result;
}

/* eslint-disable max-depth, max-statements, complexity, camelcase */
// Handle stream-sliced data, via the ETL flow.
export function parseXVIZStream(data, convertPrimitive) {
  // data is an array of objects
  // Each object is [{primitives, variables, timestamp},...]
  // Each object represents a timestamp and array of objects

  const {primitives, ui_primitives, variables, futures} = data[0];
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
  } else if (ui_primitives) {
    const streamName = Object.keys(ui_primitives)[0];
    return data.map(datum =>
      parseStreamUIPrimitives(datum.ui_primitives[streamName], streamName, datum.timestamp)
    );
  }

  return {};
}

/* Processes an individual primitive time sample and converts the
 * data to UI elements.
 */
export function parseStreamPrimitive(primitives, streamName, time, convertPrimitive) {
  const {OBJECT_STREAM, preProcessPrimitive} = getXVIZConfig();
  const PRIMITIVE_SETTINGS =
    getXVIZConfig().currentMajorVersion === 1 ? XVIZPrimitiveSettingsV1 : XVIZPrimitiveSettingsV2;

  const primitiveData = getPrimitiveData(primitives);

  if (!primitiveData || !Array.isArray(primitiveData.primitives)) {
    return {};
  }

  const {type: primType, primitives: objects} = primitiveData;

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
        preProcessPrimitive({primitive: object[j], type: primType, streamName, time});

        // process each primitive
        const primitive = normalizeXVIZPrimitive(
          PRIMITIVE_SETTINGS,
          object[j],
          objectIndex,
          streamName,
          primType,
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
      preProcessPrimitive({primitive: object, type: primType, streamName, time});

      // normalize primitive
      const primitive = normalizeXVIZPrimitive(
        PRIMITIVE_SETTINGS,
        object,
        objectIndex,
        streamName,
        primType,
        time,
        convertPrimitive
      );

      // Allow for v1 inline type to override primitive type
      category = PRIMITIVE_SETTINGS[object.type || primType].category;
      if (primitive) {
        primitiveMap[category].push(primitive);

        if (
          isMainThread &&
          // OBJECT_STREAM is deprecated, only keeping for backward compatibility
          (streamName === OBJECT_STREAM ||
            (!OBJECT_STREAM && primitive.id && category === 'features'))
        ) {
          XVIZObject.observe(primitive.id, time);
        }
      }
    }
  }

  primitiveMap.pointCloud = joinObjectPointCloudsToTypedArrays(primitiveMap.pointCloud);
  primitiveMap.time = time;

  return primitiveMap;
}

/* Processes the futures and converts the
 * data to UI elements.
 */
export function parseStreamFutures(objects, streamName, time, convertPrimitive) {
  const {currentMajorVersion} = getXVIZConfig();

  return currentMajorVersion === 1
    ? parseStreamFuturesV1(objects, streamName, time, convertPrimitive)
    : parseStreamFuturesV2(objects, streamName, time, convertPrimitive);
}

export function parseStreamFuturesV1(objects, streamName, time, convertPrimitive) {
  const futures = [];
  // objects = array of objects
  // [{timestamp, primitives[]}, ...]

  // Futures are an array of array of primitives and
  // the objectIndex is used to find the timestamp associated
  // with the set of primitives.
  objects.forEach((object, objectIndex) => {
    const {primitives} = object;

    const future = primitives
      .map(primitive =>
        normalizeXVIZPrimitive(
          XVIZPrimitiveSettingsV1,
          primitive,
          objectIndex,
          streamName,
          primitive.type,
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

export function parseStreamFuturesV2(objects, streamName, time, convertPrimitive) {
  const futures = [];

  // objects = {
  //   timestamps: [1, 2, 3],
  //   primitives: [
  //    { <type>: [ <objects for ts[1]> ] },
  //    { <type>: [ <objects for ts[2]> ] },
  //    { <type>: [ <objects for ts[3]> ] }
  //   ]
  // }

  const timestamps = objects.timestamps;
  objects.primitives.forEach((future_set, futureIndex) => {
    // Get the underlying primitive array
    const data = getPrimitiveData(future_set);

    const future = data.primitives
      .map(primitive => {
        const normalizedPrimitive = normalizeXVIZPrimitive(
          XVIZPrimitiveSettingsV2,
          primitive,
          futureIndex,
          streamName,
          data.type,
          time,
          convertPrimitive
        );

        normalizedPrimitive.timestamp = timestamps[futureIndex];
        return normalizedPrimitive;
      })
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
  const {currentMajorVersion} = getXVIZConfig();

  return currentMajorVersion === 1
    ? parseStreamVariableV1(objects, streamName, time)
    : parseStreamVariableV2(objects, streamName, time);
}

export function parseStreamVariableV1(objects, streamName, time) {
  if (Array.isArray(objects)) {
    return {};
  }

  let variable;
  const {timestamps, values} = objects;
  if (values.length === 1) {
    variable = values[0];
  } else if (timestamps) {
    variable = values.map((v, i) => [timestamps[i], v]);
  } else {
    variable = values;
  }

  const entry = {
    time,
    variable
  };

  return entry;
}

export function parseStreamVariableV2(objects, streamName, time) {
  if (Array.isArray(objects)) {
    return {};
  }

  const variables = objects.variables;
  if (!variables || !Array.isArray(variables)) {
    return {};
  }

  const result = {time};

  result.variable = variables
    .map(entry => {
      const {base, values} = entry;

      const valueData = getVariableData(values);
      if (!valueData || !valueData.values) {
        return null;
      }

      const datum = {
        values: valueData.values
      };

      if (base && base.object_id) {
        datum.id = base.object_id;
      }

      return datum;
    })
    .filter(Boolean);

  return result;
}

/* Processes a time_series sample and converts the
 * data to UI elements.
 */
export function parseStreamTimeSeries(seriesArray, streamBlackList) {
  const {currentMajorVersion} = getXVIZConfig();

  if (currentMajorVersion === 2) {
    return parseStreamTimeSeriesV2(seriesArray, streamBlackList);
  }

  throw new Error(`Invalid time_series data in XVIZ version ${currentMajorVersion}`);
}

const ValueTypes = ['doubles', 'int32s', 'bools', 'strings'];

function getVariableData(valuesObject) {
  // Primitives have the type as the first key
  const keys = Object.keys(valuesObject);

  for (const type of keys) {
    if (ValueTypes.includes(type)) {
      return {type, values: valuesObject[type]};
    }
  }

  // TODO(twojtasz): a more informative error path that doesn't abort processing
  return {};
}

function parseStreamTimeSeriesV2(seriesArray, streamBlackList) {
  if (!Array.isArray(seriesArray)) {
    return {};
  }

  const timeSeriesStreams = {};
  seriesArray.forEach(timeSeriesEntry => {
    const {timestamp, streams, values, object_id} = timeSeriesEntry;
    const valueData = getVariableData(values);

    if (!valueData || valueData.values.length !== streams.length) {
      return null;
    }

    valueData.values.forEach((variable, entryIndex) => {
      const streamName = streams[entryIndex];

      if (!streamBlackList.has(streamName)) {
        const entry = {time: timestamp, variable};
        if (object_id) {
          entry.id = object_id;
        }

        const tsStream = timeSeriesStreams[streamName];
        // TODO(twojtasz):
        // We should warn/log if a duplicate entry is seen
        if (!tsStream) {
          timeSeriesStreams[streamName] = entry;
        }
      }
    });

    // eslint consistent-return warning
    // This for loop we do not need to return any value
    return timeSeriesStreams;
  });

  return timeSeriesStreams;
}

function getVertexCount(vertices) {
  return vertices instanceof Float32Array ? vertices.length / 3 : vertices.length;
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

    // Setup for per-point color
    let vertexColors = object.colors;
    let vertexColorStride = null;
    if (vertexColors) {
      if (vertexColors.length / 4 === vertexCount) {
        vertexColorStride = 4;
      } else if (vertexColors.length / 3 === vertexCount) {
        vertexColorStride = 4;
      } else {
        vertexColors = null;
      }
    }

    const isColorFlattenedArray = ArrayBuffer.isView(object.colors);
    const vertexColorTyped = isColorFlattenedArray && vertexColorStride === 4;
    if (vertexColorTyped) {
      colors.set(object.colors, i * 4);
    }

    const isPositionFlattenedArray = ArrayBuffer.isView(object.vertices);
    if (isPositionFlattenedArray) {
      positions.set(object.vertices, i * 3);
    }

    for (let j = 0; j < vertexCount; j++, i++) {
      ids[i] = object.id;

      if (!isPositionFlattenedArray) {
        const vertex = object.vertices[j];
        positions[i * 3 + 0] = vertex[0];
        positions[i * 3 + 1] = vertex[1];
        positions[i * 3 + 2] = vertex[2];
      }

      if (!vertexColorTyped) {
        let color = object.color || DEFAULT_COLOR;
        if (vertexColors) {
          color = vertexColors[j * vertexColorStride];
        }

        colors[i * 4 + 0] = color[0];
        colors[i * 4 + 1] = color[1];
        colors[i * 4 + 2] = color[2];
        colors[i * 4 + 3] = color[3] || 255;
      }
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

export function parseStreamUIPrimitives(components, streamName, time) {
  return Object.assign({time}, components);
}
