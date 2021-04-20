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

function runWorkerTest(t, total, workerFarmConfig, onFinished, skipEnd) {
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
      if (!skipEnd) {
        t.end();
      }
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

  const updates = [];

  const callback = message => {
    t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);
    updates.push(message);
  };

  const workerFarmConfig = {
    workerURL: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    debug: callback,
    capacity: 1000
  };

  const onFinished = workerFarm => {
    t.equals(0, workerFarm.dropped, 'No data dropped');

    const messageCounts = {};
    updates.forEach(u => {
      messageCounts[u.message] = messageCounts[u.message] + 1 || 1;
    });

    t.equals(messageCounts.processing, CHUNKS_TOTAL, 'worker sends processing messages');
    t.ok(messageCounts.waiting >= MAX_CONCURRENCY, 'worker sends waiting messages');
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

class TestWorkerFarmer {
  constructor(t, id, chunks, concurrency, capacity) {
    this.t = t;
    this.id = id;
    this.chunks = chunks;
    this.concurrency = concurrency;
    this.capacity = capacity;

    this.updates = [];
  }

  config() {
    return {
      id: this.id,
      workerURL: testWorker,
      maxConcurrency: this.concurrency,
      debug: message => {
        this.t.comment(`Processing with worker ${message.worker}, backlog ${message.backlog}`);
        this.updates.push(message);
      }
    };
  }
}

test('WorkerFarm#Multiple', t => {
  if (!shouldRunTest(t)) {
    return;
  }

  const farmerA = new TestWorkerFarmer(t, 'A', 6, 3, 1000);
  const farmerB = new TestWorkerFarmer(t, 'B', 5, 2, 1000);

  let resultCalled = 0;
  const onFinished = farmer => {
    return workerFarm => {
      t.equals(0, workerFarm.dropped, 'No data dropped');

      const messageCounts = {};
      farmer.updates.forEach(u => {
        messageCounts[u.message] = messageCounts[u.message] + 1 || 1;
      });

      t.equals(messageCounts.processing, farmer.chunks, 'worker sends processing messages');
      t.ok(messageCounts.waiting >= farmer.concurrency, 'worker sends waiting messages');

      resultCalled++;
      if (resultCalled === 2) {
        t.end();
      }
    };
  };

  const skipEnd = true;
  runWorkerTest(t, farmerA.chunks, farmerA.config(), onFinished(farmerA), skipEnd);
  runWorkerTest(t, farmerB.chunks, farmerB.config(), onFinished(farmerB), skipEnd);
});
