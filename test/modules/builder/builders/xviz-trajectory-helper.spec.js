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

/* eslint-disable camelcase */
import test from 'tape-catch';
import {getGeospatialVector} from '../../../../modules/builder/src/builders/helpers/xviz-trajectory-helper';

import * as turf from '@turf/turf';

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

function equals(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => almostEqual(value, b[index]));
}

test('getGeospatialVector# west ~1000m', t => {
  const a = {longitude: -75.0, latitude: 40.0};
  const b = {longitude: -75.01174, latitude: 40};
  const result = getGeospatialVector(a, b);

  const expected = [-1000.0175798, 0.0658552];
  t.ok(equals(result, expected), 'Vector is correct');
  t.end();
});

test('getGeospatialVector# west ~1000m with heading -45deg', t => {
  const a = {longitude: -75.0, latitude: 40.0};
  const b = {longitude: -75.01174, latitude: 40};
  const result = getGeospatialVector(a, b, turf.degreesToRadians(-45));

  const expected = [-707.16577871, -707.07264];
  t.ok(equals(result, expected), 'Vector is correct');
  t.end();
});

test('getGeospatialVector# difference with -37.45deg bearing, 243.72336m', t => {
  const a = {longitude: -75.0, latitude: 40.0};
  const b = {longitude: -75.00174, latitude: 40.00174};
  const result = getGeospatialVector(a, b);

  const expected = [-148.2100726, 193.4808862];
  t.ok(equals(result, expected), 'Vector is correct');
  t.end();
});

test('getGeospatialVector# difference with -37.45 bearing, 243.72336m, heading matches bearing', t => {
  const a = {longitude: -75.0, latitude: 40.0};
  const b = {longitude: -75.00174, latitude: 40.00174};
  const result = getGeospatialVector(a, b, turf.degreesToRadians(90 + 37.45));

  // Since heading matches bearing, this makes the vector near 0 for y
  const expected = [243.72336, 0.011944];
  t.ok(equals(result, expected), 'Vector is correct');
  t.end();
});
