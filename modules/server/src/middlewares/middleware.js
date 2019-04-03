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
import {XVIZData} from '@xviz/io';

/**
 * This takes a set of XVIZ Server middleware's and
 * calls all there handlers in order.
 */
export class XVIZServerMiddlewareStack {
  constructor(middlewares) {
    this.middlewares = middlewares;
  }

  set(middlewares) {
    this.middlewares = middlewares;
  }

  onClose() {
    this.middlewareDispatch('onClose');
  }

  // Server middleware
  onConnect(request, msg) {
    this.middlewareDispatch('onConnect', request, msg);
  }

  onStart(request, msg) {
    this.middlewareDispatch('onStart', request, msg);
    // send metadata

    // version
    // profile
    // message_format json|binary
    // session_type log|live
    // log

    // version unsupported
    // profile unknown
    // format unsupported
    // session_type unknown
    // log not found
  }

  onTransformLog(request, msg) {
    this.middlewareDispatch('onTransformLog', request, msg);
    // send state_updates

    // id
    // start_timestamp
    // end_timestamp
    // desired_streams []

    // clamped timestamp

    // time range not valid
  }

  onTransformPointInTime(request, msg) {
    this.middlewareDispatch('onTransformPointInTime', request, msg);
    // send state_updates

    // id
    // query_timestamp
    // desired_streams []

    // timestamp not valid
  }

  onError(request, msg) {
    this.middlewareDispatch('onError', request, msg);
  }

  onMetadata(request, msg) {
    this.middlewareDispatch('onMetadata', request, msg);
  }

  onStateUpdate(request, msg) {
    this.middlewareDispatch('onStateUpdate', request, msg);
  }

  onTransformLogDone(request, msg) {
    this.middlewareDispatch('onTransformLogDone', request, msg);
  }

  onReconfigure(request, data) {
    // update_type delta|full
    // config_update: {}
  }

  middlewareDispatch(name, request, msg) {
    const arrayLength = this.middlewares.length;
    for (let i = 0; i < arrayLength; i++) {
      const middleware = this.middlewares[i];

      const handler = middleware[name];

      if (handler) {
        let args = [];

        // Support JS objects
        if (msg.data && !(msg.data instanceof XVIZData)) {
          msg.data = new XVIZData(msg.data);
        }
        args = [request, msg];

        handler.apply(middleware, args);
      }
    }
  }
}
