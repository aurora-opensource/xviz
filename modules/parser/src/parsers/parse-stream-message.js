/* global Blob, URL */
import {parseStreamDataMessage} from './parse-stream-data-message';
import {WorkerFarm} from '../utils/worker-utils';
import {postDeserialize} from './serialize';
import {getXVIZConfig} from '../config/xviz-config';
import streamDataWorker from '../../dist/workers/stream-data.worker.js';

let workerFarm = null;

export function initializeWorkers({worker, maxConcurrency = 4}) {
  if (!workerFarm) {
    const xvizConfig = {...getXVIZConfig()};
    delete xvizConfig.preProcessPrimitive;
    let workerURL;

    if (typeof worker === 'string') {
      // worker is an URL
      workerURL = worker;
    } else {
      // use default worker
      const blob = new Blob([streamDataWorker], {type: 'application/javascript'});
      workerURL = URL.createObjectURL(blob);
    }

    workerFarm = new WorkerFarm({
      workerURL,
      maxConcurrency,
      initialMessage: {xvizConfig}
    });
  }
}

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
  if (worker) {
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
