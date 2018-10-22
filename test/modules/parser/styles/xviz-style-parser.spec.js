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
          strokeWidth: 1,
          opacity: 0.5,
          fillColor: '#808080'
        }
      },
      {
        name: 'type=bike',
        style: {
          fillColor: '#0000FF',
          opacity: 1
        }
      },
      {
        name: 'type=car tracked',
        style: {
          strokeWidth: 3
        }
      },
      {
        name: 'tracked',
        style: {
          fillColor: '#FFFF00'
        }
      },
      {
        name: 'fancy',
        style: {
          fillColor: '#101010'
        }
      }
    ]
  }
];

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
