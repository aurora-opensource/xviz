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

import {parseXVIZStream} from './parse-xviz-stream';

function noop() {}

/**
 * Extract primitives and variables from an XVIZ stream
 *
 * @param {Array} data - datums with shape {primitives, variables}
 * @param {Object} opts - callbacks for event notification
 * @return {Array} - parsed data with shape {time, features, lookAheads, variables, labels}
 */
export function parseEtlStream(data, opts = {}) {
  // Callbacks to enable instrumentation
  const {onData = noop, onDone = noop} = opts;
  const context = onData(opts) || opts.context;

  const stream = parseXVIZStream(data, opts.convertPrimitive);

  onDone({...opts, context});
  return stream;
}
