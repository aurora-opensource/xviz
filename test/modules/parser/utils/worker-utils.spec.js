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

/* global Worker, Blob, URL */
import test from 'tape-catch';
import {WorkerFarm} from '@xviz/parser/utils/worker-utils';

let testWorker = null;

if (typeof Worker !== 'undefined') {
  const script = `
    self.onmessage = event => {
      setTimeout(() => self.postMessage(event.data), 50);
    };
  `;
  const blob = new Blob([script], {type: 'application/javascript'});
  testWorker = URL.createObjectURL(blob);
}

function shouldRunTest(t) {
  if (!testWorker) {
    t.comment('Worker test is browser only');
    t.end();
    return false;
  }

  return true;
}

function runWorkerTest(t, total, workerFarmConfig, onFinished) {
  let processed = 0;

  const workerFarm = new WorkerFarm(workerFarmConfig);

  const onResult = (expected, result) => {
    processed++;
    t.deepEquals(result, expected, 'worker returns expected result');

    if (processed + workerFarm.dropped === total) {
      if (onFinished) {
        onFinished(workerFarm);
      }
      workerFarm.destroy();
      t.end();
    }
  };

  for (let i = 0; i < total; i++) {
    const testData = {chunk: i};
    workerFarm.process(testData, onResult.bind(null, testData), err => t.fail(err));
  }
}

test('WorkerFarm#Normal', t => {
  if (!shouldRunTest(t)) {
    return;
  }

  const CHUNKS_TOTAL = 6;
  const MAX_CONCURRENCY = 3;

  const callback = message => {
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);
  };

  const workerFarmConfig = {
    workerURL: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    debug: callback,
    capacity: 1000
  };

  const onFinished = workerFarm => {
    t.equals(0, workerFarm.dropped, 'No data dropped');
  };

  runWorkerTest(t, CHUNKS_TOTAL, workerFarmConfig, onFinished);
});

test('WorkerFarm#Capped', t => {
  if (!shouldRunTest(t)) {
    return;
  }

  const CHUNKS_TOTAL = 20;
  const MAX_CONCURRENCY = 2;
  const CAPACITY = 1;

  let dropped = 0;

  const callback = message => {
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);
    dropped = message.dropped;
  };

  const workerFarmConfig = {
    workerURL: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    debug: callback,
    capacity: CAPACITY
  };

  const onFinished = () => {
    t.ok(dropped > 0, `we expected dropps, and we dropped: ${(dropped / CHUNKS_TOTAL) * 100}%`);
  };

  runWorkerTest(t, CHUNKS_TOTAL, workerFarmConfig, onFinished);
});
