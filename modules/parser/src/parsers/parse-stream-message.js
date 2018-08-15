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
