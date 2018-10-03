/* eslint-disable */
import test from 'tape-catch';
import {validateStreamId} from '@xviz/builder/utils';

test('validateStreamId', t => {
  const validTestCases = [
    '/vehicle-pose',
    '/tracklets/objects',
    '/tracklets/objects-1',
    '/tracklets/objects_2',
    '/tracklets/objects.3',
    '/tracklets/objects:4'
  ];

  const invalidTestCases = ['vehicle-pose', '/tracklets/objects/', '/tracklets/objects%b'];

  const validCasesResults = validTestCases.map(testCase => validateStreamId(testCase));
  const invalidCasesResults = invalidTestCases.map(testCase => validateStreamId(testCase));
  console.log(invalidCasesResults);

  t.ok(validCasesResults.every(res => res), 'All of the cases should be valid.');
  t.ok(invalidCasesResults.every(res => !res), 'All of the cases should be invalid.');

  t.end();
});
