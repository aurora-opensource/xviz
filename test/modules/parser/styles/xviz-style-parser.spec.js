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

import {XvizStyleParser, Stylesheet} from '@xviz/parser';
import tape from 'tape-catch';

const TEST_STYLESHEET = {
  '*': {
    extruded: true,
    height: 1.5,
    strokeWidth: 1,
    opacity: 0.5,
    fillColor: '#808080'
  },
  'type=bike': {
    fillColor: '#0000FF',
    opacity: 1
  },
  'type=car tracked': {
    strokeWidth: 3
  },
  tracked: {
    fillColor: '#FFFF00'
  },
  fancy: {
    fillColor: '#101010'
  }
};

const BIKE = {type: 'bike'};
const CAR = {type: 'car'};
const TRACKED_CAR = {type: 'car', state: {tracked: true}};
const TRACKED_BIKE = {type: 'bike', state: {tracked: true}};
const FANCY_BUS = {type: 'bus', classes: ['fancy']};
const GET_PROPERTY_TEST_CASES = [
  {
    propertyName: 'height',
    state: CAR,
    output: 1.5
  },
  {
    propertyName: 'fillColor',
    state: CAR,
    output: [128, 128, 128]
  },
  {
    propertyName: 'fillColor',
    state: BIKE,
    output: [0, 0, 255]
  },
  {
    propertyName: 'fillColor',
    state: TRACKED_CAR,
    output: [255, 255, 0]
  },
  {
    propertyName: 'fillColor',
    state: TRACKED_BIKE,
    output: [255, 255, 0]
  },
  {
    propertyName: 'strokeWidth',
    state: CAR,
    output: 1
  },
  {
    propertyName: 'strokeWidth',
    state: TRACKED_CAR,
    output: 3
  },
  {
    propertyName: 'fillColor',
    state: FANCY_BUS,
    output: [16, 16, 16]
  }
];

const GET_DEPS_TEST_CASES = [
  {
    propertyName: 'fillColor',
    output: ['fancy', 'tracked', 'type']
  },
  {
    propertyName: 'strokeWidth',
    output: ['type', 'tracked']
  },
  {
    propertyName: 'opacity',
    output: ['type']
  },
  {
    propertyName: 'height',
    output: []
  }
];

tape('XvizStyleParser', t => {
  const styleParser = new XvizStyleParser();

  t.ok(styleParser, 'XvizStyleParser constructor does not throw error');
  t.ok(
    styleParser.getStylesheet('stream') instanceof Stylesheet,
    'XvizStyleParser.getStylesheet returns a Stylesheet'
  );

  t.end();
});

tape('XvizStyleParser#Stylesheet', t => {
  const stylesheet = new Stylesheet(TEST_STYLESHEET);

  t.ok(stylesheet, 'Stylesheet constructor does not throw error');
  t.is(stylesheet.getPropertyDefault('opacity'), 1, 'returns default property value');

  GET_PROPERTY_TEST_CASES.forEach(testCase => {
    t.deepEquals(
      stylesheet.getProperty(testCase.propertyName, testCase.state),
      testCase.output,
      'getProperty returns correct value'
    );
  });

  GET_DEPS_TEST_CASES.forEach(testCase => {
    t.deepEquals(
      stylesheet.getPropertyDependencies(testCase.propertyName),
      testCase.output,
      'getPropertyDependencies returns correct value'
    );
  });

  t.end();
});
