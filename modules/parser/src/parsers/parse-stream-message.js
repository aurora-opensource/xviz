import {parseStreamDataMessage} from './parse-stream-data-message';
import {WorkerFarm} from '../utils/worker-utils';
import {postDeserialize} from './serialize';

let workerFarm = null;

export function initializeWorkers({worker, maxConcurrency = 4}) {
  if (!workerFarm) {
    workerFarm = new WorkerFarm({
      processor: worker,
      maxConcurrency
    });
  }
}

/* eslint-disable no-constant-condition */
export function parseStreamMessage({
  message,
  // callbacks
  onResult,
  onError,
  debug,
  // worker options
  worker = false,
  maxConcurrency = 4
}) {
  if (false && worker) {
    if (!workerFarm) {
      initializeWorkers({worker, maxConcurrency});
    }
    if (debug) {
      workerFarm.debug = debug;
    }

    const onMessage = data => onResult(postDeserialize(data));
    workerFarm.process(message, onMessage, onError);
  } else {
    parseStreamDataMessage(message, onResult, onError);
  }
}
