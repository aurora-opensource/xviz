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

test('WorkerFarm', t => {
  if (!testWorker) {
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
    workerURL: testWorker,
    maxConcurrency: MAX_CONCURRENCY,
    debug: callback
  });

  for (let i = 0; i < CHUNKS_TOTAL; i++) {
    const testData = {chunk: i};
    workerFarm.process(testData, onResult.bind(null, testData), err => t.fail(err));
  }
});
