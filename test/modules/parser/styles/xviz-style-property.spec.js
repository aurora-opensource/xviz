import XVIZStyleProperty from '@xviz/parser/styles/xviz-style-property';
import tape from 'tape-catch';

tape('XVIZStyleProperty#getDefault', t => {
  t.ok(Number.isFinite(XVIZStyleProperty.getDefault('opacity')), 'gets default opacity');
  t.ok(Array.isArray(XVIZStyleProperty.getDefault('stroke_color')), 'gets default stroke color');

  t.end();
});

tape('XVIZStyleProperty', t => {
  const testCases = [
    {
      key: 'height',
      value: 10,
      output: 10,
      message: 'gets numeric value'
    },
    {
      key: 'height',
      value: '10',
      output: 10,
      message: 'gets numeric value'
    },
    {
      key: 'height',
      value: ['10', '20'],
      output: 10,
      message: 'gets numeric value'
    },
    {
      key: 'height',
      value: 'undefined',
      shouldThrow: true,
      message: 'illegal number'
    },
    {
      key: 'height',
      value: undefined,
      shouldThrow: true,
      message: 'illegal number'
    },
    {
      key: 'extruded',
      value: true,
      output: true,
      message: 'gets boolean value'
    },
    {
      key: 'extruded',
      value: 'true',
      output: true,
      message: 'gets boolean value'
    },
    {
      key: 'extruded',
      value: 'false',
      output: false,
      message: 'gets boolean value'
    },
    {
      key: 'extruded',
      value: 0,
      output: false,
      message: 'gets boolean value'
    },
    {
      key: 'extruded',
      value: [1, 0],
      output: true,
      message: 'gets boolean value'
    },
    {
      key: 'extruded',
      value: null,
      shouldThrow: true,
      message: 'illegal boolean'
    },
    {
      key: 'fill_color',
      value: '#f00',
      output: [255, 0, 0],
      message: 'gets color value'
    },
    {
      key: 'fill_color',
      value: [255, 0, 0],
      output: [255, 0, 0],
      message: 'gets color value'
    },
    {
      key: 'fill_color',
      value: ['#f00', '#0f0'],
      context: {index: 1},
      output: [0, 255, 0],
      message: 'gets color value'
    },
    {
      key: 'fill_color',
      value: ['#f00', '#0f0'],
      context: {index: 3},
      output: [0, 255, 0],
      message: 'gets color value'
    },
    {
      key: 'fill_color',
      value: 'undefined',
      shouldThrow: true,
      message: 'illegal color'
    },
    {
      key: 'fill_color',
      value: undefined,
      shouldThrow: true,
      message: 'illegal color'
    }
  ];

  testCases.forEach(testCase => {
    if (testCase.shouldThrow) {
      t.throws(
        () => new XVIZStyleProperty(testCase.key, testCase.value),
        /illegal/i,
        testCase.message
      );
    } else {
      const property = new XVIZStyleProperty(testCase.key, testCase.value);
      t.deepEquals(property.getValue(testCase.context || {}), testCase.output, testCase.message);
    }
  });

  t.end();
});
