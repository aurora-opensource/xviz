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

import {XVIZProviderRequestHandler} from '../middlewares/xviz-provider-request-handler';
import {XVIZWebsocketSender} from '../middlewares/xviz-websocket-sender';
import {XVIZMessageToMiddleware} from '../middlewares/xviz-message-to-middleware';

import {XVIZServerMiddlewareStack} from '../middlewares/xviz-server-middleware-stack';
import {XVIZSessionContext} from '../middlewares/xviz-session-context';

// XVIZProviderSession handles the socket and dispatching to the middleware
//
// anyone else can add their own session
// - Would someone want to "mix" sessions?
// - if so they just create a wrapper that if XVIZ session is happy
//   they can attach to it and proxy as necessary
// - say they want to handle xvIZ data, but then want to mutate or
//   add data (custom) for messages, they could try to handle first,
//   else send to XVIZ
export class XVIZProviderSession {
  constructor(socket, request, provider, options) {
    this.socket = socket;
    this.request = request;
    this.provider = provider;
    this.options = options;
    this.middleware = null;

    // session shared storage for the middlewares
    this.context = new XVIZSessionContext();
    if (options.id) {
      this.context.set('id', options.id);
    }

    this._setupSocket();
    this._setupMiddleware();

    this.handler = new XVIZMessageToMiddleware(this.middleware);
  }

  log(msg, ...args) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(`${msg}`, ...args);
    }
  }

  info(...msg) {
    const {logger} = this.options;
    if (logger && logger.info) {
      logger.info(...msg);
    }
  }

  _setupSocket() {
    this.socket.onerror = err => {
      this._onSocketError(err);
    };

    this.socket.onclose = event => {
      this._onSocketClose(event);
    };

    this.socket.onopen = () => {
      this._onSocketOpen();
    };

    this.socket.onmessage = message => {
      this._onSocketMessage(message);
    };
  }

  _setupMiddleware() {
    this.middleware = new XVIZServerMiddlewareStack();

    const stack = [
      new XVIZProviderRequestHandler(this.context, this.provider, this.middleware, this.options),
      new XVIZWebsocketSender(this.context, this.socket, this.options)
    ];
    this.middleware.set(stack);
  }

  _onSocketOpen() {
    this.log('[> Socket] Open');
  }

  _onSocketError(error) {
    this.log('[> Socket] Error: ', error.toString());
  }

  _onSocketClose(event) {
    this.log(`[> Socket] Close: Code ${event.code} Reason: ${event.reason}`);
  }

  _onSocketMessage(message) {
    if (!this.handler.onMessage(message)) {
      this.log('[> Socket] Unknown message: ', JSON.stringify(message, null, 2).slice(0, 100));
    }
  }

  onConnect() {
    this.log('[> Connection] made');

    const params = this.request.params;
    // Providers have already decided via the URL Path
    // that this is a valid source, so we can
    // treat connection as 'start' and send metadata
    this.handler.callMiddleware('start', params);

    if (params.session_type === 'live') {
      // If 'live' we start sending data immediately
      this.handler.callMiddleware('transform_log', {id: 'live', ...params});
    }
  }
}
