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

// `require` is resolved by webpack
// `goldenImage` is resolved in node, relative to root
const TEST_CASES = [
  {
    name: 'circle',
    frames: [
      require('@xviz/conformance/inputs/circle/style/1-frame.json'),
      require('@xviz/conformance/inputs/circle/style/2-frame.json')
    ],
    goldenImage: 'modules/conformance/inputs/circle/style/output.png'
  }
];

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
    renderXVIZ(context, testCase.frames);

    window
      .browserTestDriver_captureAndDiffScreen(
        Object.assign({
          tolerance: 0.1,
          threshold: 0.99,
          goldenImage: testCase.goldenImage,
          region: getBoundingBoxInPage(canvas)
        })
      )
      .then(result => {
        t.ok(result.success, result.error || `match ${result.matchPercentage}`);
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
