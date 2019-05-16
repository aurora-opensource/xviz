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
  onConnect(request, response) {
    this.middlewareDispatch('onConnect', request, response);
  }

  onStart(request, response) {
    this.middlewareDispatch('onStart', request, response);
  }

  onTransformLog(request, response) {
    this.middlewareDispatch('onTransformLog', request, response);
  }

  onTransformPointInTime(request, response) {
    this.middlewareDispatch('onTransformPointInTime', request, response);
  }

  onError(request, response) {
    this.middlewareDispatch('onError', request, response);
  }

  onMetadata(request, response) {
    this.middlewareDispatch('onMetadata', request, response);
  }

  onStateUpdate(request, response) {
    this.middlewareDispatch('onStateUpdate', request, response);
  }

  onTransformLogDone(request, response) {
    this.middlewareDispatch('onTransformLogDone', request, response);
  }

  onReconfigure(request, response) {
    this.middlewareDispatch('reconfigure', request, response);
  }

  middlewareDispatch(name, request, response) {
    const arrayLength = this.middlewares.length;
    for (let i = 0; i < arrayLength; i++) {
      const middleware = this.middlewares[i];

      const handler = middleware[name];

      if (handler) {
        let args = [];

        // Support JS objects
        if (response.data && !(response.data instanceof XVIZData)) {
          response.data = new XVIZData(response.data);
        }
        args = [request, response];

        const nextMiddleware = handler.apply(middleware, args);
        if (nextMiddleware === false) {
          break;
        }
      }
    }
  }
}
