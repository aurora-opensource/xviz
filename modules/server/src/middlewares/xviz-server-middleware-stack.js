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
  onConnect() {
    this.middlewareDispatch('onConnect');
  }

  onStart(msg) {
    this.middlewareDispatch('onStart', msg);
  }

  onTransformLog(msg) {
    this.middlewareDispatch('onTransformLog', msg);
  }

  onTransformPointInTime(msg) {
    this.middlewareDispatch('onTransformPointInTime', msg);
  }

  onError(msg) {
    this.middlewareDispatch('onError', msg);
  }

  onMetadata(msg) {
    this.middlewareDispatch('onMetadata', msg);
  }

  onStateUpdate(msg) {
    this.middlewareDispatch('onStateUpdate', msg);
  }

  onTransformLogDone(msg) {
    this.middlewareDispatch('onTransformLogDone', msg);
  }

  onReconfigure(msg) {
    this.middlewareDispatch('onReconfigure', msg);
  }

  middlewareDispatch(name, msg) {
    const arrayLength = this.middlewares.length;
    for (let i = 0; i < arrayLength; i++) {
      const middleware = this.middlewares[i];

      const handler = middleware[name];

      if (handler) {
        let args = [];

        // Support JS objects
        if (msg && !(msg instanceof XVIZData)) {
          msg = new XVIZData(msg);
        }
        args = [msg];

        const nextMiddleware = handler.apply(middleware, args);
        if (nextMiddleware === false) {
          break;
        }
      }
    }
  }
}
