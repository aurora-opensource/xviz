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
/* eslint-disable camelcase */

import {isXVIZMessage, XVIZData} from '@xviz/io';

// Map XVIZ messages to the middleware
export class XVIZMessageToMiddleware {
  constructor(middleware, options = {}) {
    this.middleware = middleware;
    this.options = options;
  }

  info(...msg) {
    const {logger} = this.options;
    if (logger && logger.info) {
      logger.info(...msg);
    }
  }

  // onMessage takes an Event and if the message.data
  // contains an XVIZ message will dispatch to the middleware.
  //
  // Returns true if XVIZ message was dispatched
  // Returns false if was not an XVIZ message
  onMessage(message) {
    if (isXVIZMessage(message.data)) {
      // Since this is the server we assume the message
      // we get is simple and instantiate the message immediately
      // We also need to do this to get the "type()"
      const xvizData = new XVIZData(message.data);
      this.callMiddleware(xvizData.type, xvizData);
      return true;
    }

    return false;
  }

  callMiddleware(xvizType, msg = {}) {
    this.info(`[> ${xvizType.toUpperCase()}]`);
    switch (xvizType) {
      // Connection events
      case 'connect':
        this.middleware.onConnect();
        break;
      case 'close':
        this.middleware.onClose();
        break;

      // XVIZ Message Types
      case 'start':
        this.middleware.onStart(msg);
        break;
      case 'metadata':
        this.middleware.onMetadata(msg);
        break;
      case 'state_update':
        this.middleware.onStateUpdate(msg);
        break;
      case 'transform_log':
        this.middleware.onTransformLog(msg);
        break;
      case 'transform_done':
        this.middleware.onTransformLogDone(msg);
        break;
      case 'transform_point_in_time':
        this.middleware.onTransformPointInTime(msg);
        break;
      case 'reconfigure':
        this.middleware.onReconfigure(msg);
        break;
      case 'error':
        this.middleware.onError(msg);
        break;

      default:
        const message = `Error: unknown XVIZ message type ${xvizType}`;
        this.middleware.onError({type: 'xviz/error', data: {message}});
        break;
    }
  }
}
