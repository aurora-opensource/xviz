/* eslint-disable camelcase */
import {XvizStyleParser, Stylesheet} from '@xviz/parser';
import tape from 'tape-catch';

const TEST_STYLESHEETS = [
  {
    title: 'Array style',
    stylesheet: [
      {
        name: '*',
        style: {
          extruded: true,
          height: 1.5,
          stroke_width: 1,
          opacity: 0.5,
          fill_color: '#808080'
        }
      },
      {
        name: 'type=bike',
        style: {
          fill_color: '#0000FF',
          opacity: 1
        }
      },
      {
        name: 'type=car tracked',
        style: {
          stroke_width: 3
        }
      },
      {
        name: 'tracked',
        style: {
          fill_color: '#FFFF00'
        }
      },
      {
        name: 'fancy',
        style: {
          fill_color: '#101010'
        }
      }
    ]
  }
];

const BIKE = {type: 'bike'};
const CAR = {type: 'car'};
const TRACKED_CAR = {type: 'car', state: {tracked: true}};
const TRACKED_BIKE = {type: 'bike', state: {tracked: true}};
const FANCY_BUS = {type: 'bus', base: {classes: ['fancy']}};
const GET_PROPERTY_TEST_CASES = [
  {
    propertyName: 'height',
    state: CAR,
    output: 1.5
  },
  {
    propertyName: 'fill_color',
    state: CAR,
    output: [128, 128, 128]
  },
  {
    propertyName: 'fill_color',
    state: BIKE,
    output: [0, 0, 255]
  },
  {
    propertyName: 'fill_color',
    state: TRACKED_CAR,
    output: [255, 255, 0]
  },
  {
    propertyName: 'fill_color',
    state: TRACKED_BIKE,
    output: [255, 255, 0]
  },
  {
    propertyName: 'stroke_width',
    state: CAR,
    output: 1
  },
  {
    propertyName: 'stroke_width',
    state: TRACKED_CAR,
    output: 3
  },
  {
    propertyName: 'fill_color',
    state: FANCY_BUS,
    output: [16, 16, 16]
  }
];

const GET_DEPS_TEST_CASES = [
  {
    propertyName: 'fill_color',
    output: ['fancy', 'tracked', 'type']
  },
  {
    propertyName: 'stroke_width',
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
  for (const testData of TEST_STYLESHEETS) {
    t.comment(testData.title);
    const stylesheet = new Stylesheet(testData.stylesheet);

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
  }

  t.end();
});
