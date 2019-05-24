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

/* eslint-disable */
import test from 'tape-catch';
import {toLowPrecision} from '@xviz/builder/utils';

import {encodeBinaryXVIZ} from '@xviz/builder';
import {parseBinaryXVIZ, XVIZ_GLTF_EXTENSION} from '@xviz/parser';

import {GLBWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

import clone from 'clone';

const TEST_CASES = {
  flat: {
    vertices: [
      [
        12.458602928956001,
        2.7320427081205123,
        0,
        11.504415873922731,
        4.285679511764174,
        0,
        15.282629201197484,
        6.606120324948342,
        0,
        16.236816256230753,
        5.05248352130468,
        0,
        12.458602928956001,
        2.7320427081205123,
        0
      ]
    ]
  },

  nested: {
    vertices: [
      [12.458602928956001, 2.7320427081205123, 0],
      [11.504415873922731, 4.285679511764174, 0],
      [15.282629201197484, 6.606120324948342, 0],
      [16.236816256230753, 5.05248352130468, 0],
      [12.458602928956001, 2.7320427081205123, 0]
    ]
  },

  full: require('../../../data/sample-xviz.json')
};

test('XVIZLoader#parse', t => {
  const expectedStateUpdate = {
    type: 'xviz/state_update',
    data: {
      update_type: 'complete_state',
      updates: [
        {
          timestamp: 1001.3,
          primitives: {
            '/object/points': {
              points: [
                {
                  points: [1, 2, 3, 4, 5, 6]
                }
              ]
            }
          }
        }
      ]
    }
  };

  // Replace the array content with an accessor
  const accessorStateUpdate = clone(expectedStateUpdate);
  accessorStateUpdate.data.updates[0].primitives['/object/points'].points[0].points =
    '#/accessors/0';

  // Legacy format
  const baseGlbJsonObject = {
    asset: {version: '2.0'},
    accessors: [{bufferView: 0, componentType: 5121, count: 2, type: 'VEC3'}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 8}],
    buffers: [{byteLength: 8}]
  };

  const legacyGlbJsonObject = {
    xviz: accessorStateUpdate,
    ...baseGlbJsonObject
  };

  const glbBinary = new Uint8Array([1, 2, 3, 4, 5, 6]); // "\x1\x2\x3\x4\x4\x2";
  const arrayBuffer = encodeSync({json: legacyGlbJsonObject, binary: glbBinary}, GLBWriter, {});

  const json = parseBinaryXVIZ(arrayBuffer);
  delete json.data.updates[0].primitives['/object/points'].points[0].points.accessor;

  t.deepEqual(json, expectedStateUpdate, 'Parse legacy GLB correctly');

  // New more compatible format
  const extensions = {};
  extensions[XVIZ_GLTF_EXTENSION] = accessorStateUpdate;

  const compatibleGlbJsonObject = {
    extensions,
    extensionsUsed: [XVIZ_GLTF_EXTENSION],
    ...baseGlbJsonObject
  };

  const compatibleArrayBuffer = encodeSync(
    {json: compatibleGlbJsonObject, binary: glbBinary},
    GLBWriter,
    {}
  );

  const compatibleJson = parseBinaryXVIZ(compatibleArrayBuffer);
  console.log(`RESULT: |${JSON.stringify(compatibleJson, '', 4)}|`);
  delete compatibleJson.data.updates[0].primitives['/object/points'].points[0].points.accessor;

  t.deepEqual(compatibleJson, expectedStateUpdate, 'Parse compatible GLB correctly');

  t.end();
});

test('XVIZLoader#encode-and-parse', t => {
  for (const tcName in TEST_CASES) {
    const TEST_JSON = TEST_CASES[tcName];

    const glbFileBuffer = encodeBinaryXVIZ(TEST_JSON, {flattenArrays: true});
    const json = parseBinaryXVIZ(glbFileBuffer);

    t.ok(
      !Array.isArray(json.buffers),
      `${tcName} Encoded and parsed XVIZ - has no JSON buffers field`
    );
    t.ok(
      !Array.isArray(json.bufferViews),
      `${tcName} Encoded and parsed XVIZ - has no JSON bufferViews field`
    );
    t.ok(
      !Array.isArray(json.accessors),
      `${tcName} Encoded and parsed XVIZ - has no JSON accessors field`
    );

    // const reference = toLowPrecision(packJsonArrays(TEST_JSON));
    // t.deepEqual(
    //   toLowPrecision(json),
    //   reference,
    //   `${tcName} Encoded and parsed XVIZ did not change data`
    // );
  }

  t.end();
});

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

function validateLidarData(t, lidarData) {
  t.equal(lidarData.vertices.length, 9, 'vertices has 9 floats');
  t.ok(almostEqual(lidarData.vertices[0], 1.0), 'vertices[0] is 1.0');
  t.ok(almostEqual(lidarData.vertices[1], 2.0), 'vertices[1] is 2.0');
  t.ok(almostEqual(lidarData.vertices[2], 3.0), 'vertices[2] is 3.0');
  t.equal(lidarData.reflectance.length, 3, 'reflectance has 3 floats');
  t.ok(almostEqual(lidarData.reflectance[0], 9.0), 'reflectance[0] is 9.0');
  t.ok(almostEqual(lidarData.reflectance[1], 8.0), 'reflectance[1] is 8.0');
  t.ok(almostEqual(lidarData.reflectance[2], 7.0), 'reflectance[2] is 7.0');
}

test('pack-unpack-pack-json', t => {
  const options = {flattenArrays: true};
  // Must have 2 buffers since they will be read in as
  // one, and then the sub-buffers will be "copied" out.
  const sample_lidar = {
    timestamp: 1317042272459,
    type: 'points3d',
    color: [255, 0, 0, 255],
    vertices: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    reflectance: new Float32Array([9, 8, 7])
  };

  const frame = {
    state_updates: [
      {
        timestamps: 1317042272459,
        primitives: {}
      }
    ]
  };

  const xvizBinary = encodeBinaryXVIZ(sample_lidar, options);
  const xvizBinaryDecoded = parseBinaryXVIZ(xvizBinary);

  validateLidarData(t, xvizBinaryDecoded);

  frame.state_updates[0].primitives.lidarPoints = xvizBinaryDecoded;

  const frameBinary = encodeBinaryXVIZ(frame, options);
  // TODO/ib - might be interesting to check why this has increased.
  // Should make effort to keep overhead small in loaders.gl
  t.equal(frameBinary.byteLength, 584);

  const xvizBinaryDecoded2 = parseBinaryXVIZ(frameBinary);
  const lidar = xvizBinaryDecoded2.state_updates[0].primitives.lidarPoints;
  validateLidarData(t, xvizBinaryDecoded);

  t.end();
});
