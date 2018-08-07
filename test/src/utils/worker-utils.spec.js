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

/* global Worker */
import test from 'tape-catch';
import {processWithWorker, WorkerFarm} from 'xviz/utils/worker-utils';

const hasWorker = typeof Worker !== 'undefined';

const testWorker = require.resolve('./test-worker');

test('processWithWorker', t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }
  const testBuffer = new Float32Array(100).buffer;

  processWithWorker(testWorker)(testBuffer)
    .then(result => {
      t.ok(result instanceof ArrayBuffer, 'worker returns expected result');
      t.end();
    })
    .catch(err => {
      t.fail(err);
      t.end();
    });
});

test('WorkerFarm', t => {
  if (!hasWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return;
  }

  const CHUNKS_TOTAL = 6;
  const MAX_CONCURRENCY = 3;

  let processed = 0;

  const callback = message =>
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);

  const onResult = (expected, result) => {
    processed++;
    t.deepEquals(result, expected, 'worker returns expected result');
    if (processed === CHUNKS_TOTAL) {
      t.end();
    }
  };

  const workerFarm = new WorkerFarm({
    processor: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    debug: callback
  });

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const testData = {chunk: i};
    workerFarm.process(testData, onResult.bind(testData), err => t.fail(err));
  }
});
