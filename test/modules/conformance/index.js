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

/* global window, document */
import test from 'tape-catch';
import renderXVIZ from './renderer';

// Path here is relative from "modules/conformance/inputs" and
// expects the following in that directory:
//  - 1-frame.json - metadata file
//  - 2-frame.json - state_update file
//  - output.png - golden image
const TEST_CASES = [
  makeTestCase('circle/style'),
  makeTestCase('point/style'),
  makeTestCase('polyline/style'),
  makeTestCase('polygon/style'),
  makeTestCase('text/style'),
  makeTestCase('stadium/style')
];

const DEBUG = false;

// `require` is resolved by webpack
// `goldenImage` is resolved in node, relative to root
function makeTestCase(name) {
  return {
    name,
    frames: [
      require(`@xviz/conformance/inputs/${name}/1-frame.json`),
      require(`@xviz/conformance/inputs/${name}/2-frame.json`)
    ],
    goldenImage: `modules/conformance/inputs/${name}/output.png`
  };
}

function getBoundingBoxInPage(canvas) {
  const bbox = canvas.getBoundingClientRect();
  return {
    x: window.scrollX + bbox.x,
    y: window.scrollY + bbox.y,
    width: bbox.width,
    height: bbox.height
  };
}

function run(testCase) {
  test(testCase.name, t => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    document.body.append(canvas);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ccc';
    context.fillRect(0, 0, canvas.width, canvas.height);

    renderXVIZ(context, testCase.frames);

    window
      .browserTestDriver_captureAndDiffScreen(
        Object.assign({
          tolerance: 0.1,
          threshold: 0.999,
          goldenImage: testCase.goldenImage,
          region: getBoundingBoxInPage(canvas),
          // set DEBUG above to true to overwrite golden image
          saveOnFail: DEBUG,
          saveAs: '[name].png'
        })
      )
      .then(result => {
        t.ok(result.success, result.error || `match ${result.matchPercentage}`);
        if (!DEBUG) {
          document.body.removeChild(canvas);
        }
        t.end();
      });
  });
}

test('Conformance', t => {
  for (const testCase of TEST_CASES) {
    run(testCase);
  }
  t.end();
});
