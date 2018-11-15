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

export function getTransferList(object, recursive = true, transfers) {
  // Make sure that items in the transfer list is unique
  const transfersSet = transfers || new Set();

  if (!object) {
    // ignore
  } else if (object instanceof ArrayBuffer) {
    transfersSet.add(object);
  } else if (object.buffer && object.buffer instanceof ArrayBuffer) {
    // Typed array
    transfersSet.add(object.buffer);
  } else if (recursive && typeof object === 'object') {
    for (const key in object) {
      // Avoid perf hit - only go one level deep
      getTransferList(object[key], false, transfersSet);
    }
  }

  // If transfers is defined, is internal recursive call
  // Otherwise it's called by the user
  return transfers === undefined ? Array.from(transfersSet) : null;
}

/**
 * A worker in the WorkerFarm
 */
class WorkerThread {
  constructor({url, metadata, initialMessage}) {
    this.worker = new Worker(url);
    this.isBusy = false;
    this.metadata = metadata;

    if (initialMessage) {
      this.worker.postMessage(initialMessage, getTransferList(initialMessage));
    }
  }

  process(data) {
    const {worker} = this;

    return new Promise((resolve, reject) => {
      worker.onmessage = e => {
        this.isBusy = false;
        // console.log(e.data._size, `${Date.now() - e.data._sentAt}ms`);
        resolve(e.data);
      };

      worker.onerror = err => {
        this.isBusy = false;
        reject(err);
      };

      this.isBusy = true;
      worker.postMessage(data, getTransferList(data));
    });
  }

  terminate() {
    this.worker.terminate();
    this.worker = null;
  }
}

/**
 * Process multiple data messages with a fleet of workers
 */
export class WorkerFarm {
  /**
   * @param workerURL {function | string} - worker function
   * @param maxConcurrency {number} - max count of workers
   */
  constructor({workerURL, maxConcurrency = 1, debug = () => {}, initialMessage = null}) {
    this.workerURL = workerURL;
    this.workers = [];
    this.queue = [];
    this.debug = debug;

    for (let i = 0; i < maxConcurrency; i++) {
      this.workers[i] = new WorkerThread({
        url: this.workerURL,
        metadata: {name: `${i}/${maxConcurrency}`},
        initialMessage
      });
    }
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
  }

  getAvailableWorker() {
    return this.workers.find(worker => !worker.isBusy);
  }

  next() {
    const {queue} = this;

    while (queue.length) {
      const worker = this.getAvailableWorker();
      if (!worker) {
        break;
      }
      const job = queue.shift();

      this.debug({
        message: 'processing',
        worker: worker.metadata.name,
        backlog: queue.length
      });

      worker
        .process(job.data)
        .then(job.onResult)
        .catch(job.onError)
        .then(() => this.next());
    }
  }

  process(data, onResult, onError) {
    this.queue.push({data, onResult, onError});
    this.next();
  }
}
