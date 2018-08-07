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
