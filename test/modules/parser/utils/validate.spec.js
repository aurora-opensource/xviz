import test from 'tape-catch';
import validate from '@xviz/parser/utils/validate';

const TEST_CASES = [
  {
    type: 'vehicle-pose',
    input: {},
    output: false,
    error: /time is required/
  }, {
    type: 'vehicle-pose',
    input: {time: '2018-08-16'},
    output: false,
    error: /time is not .* number/
  }, {
    type: 'vehicle-pose',
    input: {time: 0, latitude: 37.78, longitude: -122.45},
    output: true
  }, {
    type: 'vehicle-pose',
    input: {time: 0, latitude: 37.78, longitude: -122.45, pose: {position: {x: 0, y: 0}}},
    output: false,
    error: /position is not .* array/
  }
];

test('validate', t => {
  TEST_CASES.forEach(testCase => {
    t.is(validate(testCase.input, testCase.type), testCase.output, `${testCase.type} validated`);

    if (testCase.error) {
      t.throws(
        () => validate(testCase.input, testCase.type, {throwError: true}),
        testCase.error,
        'Error message correct'
      );
    }
  });

  t.end();
});
