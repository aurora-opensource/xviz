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
import {isXVIZMessage} from '@xviz/parser';
import {XVIZData} from '@xviz/io';

import {XVIZProviderRequestHandler} from '../middlewares/xviz-provider-request-handler';
import {XVIZWebsocketSender} from '../middlewares/xviz-websocket-sender';

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

    // session shared storage for the middlewares
    this.context = new XVIZSessionContext();
    if (options.id) {
      this.context.set('id', options.id);
    }

    this.middleware = null;

    this._setupSocket();
    this._setupMiddleware();
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
      this.onError(err);
    };

    this.socket.onclose = event => {
      this.onClose(event);
    };

    this.socket.onopen = () => {
      this.onOpen();
    };

    this.socket.onmessage = message => {
      this.onMessage(message);
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

  onOpen() {
    this.log('[> Connection] Open');
  }

  onError(error) {
    this.log('[> Connection] Error: ', error.toString());
  }

  onClose(event) {
    this.log(`[> Connection] Close: Code ${event.code} Reason: ${event.reason}`);
  }

  onConnect() {
    this.log('[> Connection] made');

    const params = this.request.params;
    // Providers have already decided via the URL Path
    // that this is a valid source, so we can
    // treat connection as 'start' and send metadata
    // TODO: this is totally wrong.  params is not an XVIZ Message
    this.callMiddleware('start', params);

    // TODO: if live we should start sending data immediately
    // this.callMiddleware('transform_log', {id: 'live'});
  }

  onMessage(message) {
    if (isXVIZMessage(message.data)) {
      // Since this is the server we assume the message
      // we get is simple and instantiate the message immediately
      // We also need to do this to get the "type()"
      const xvizData = new XVIZData(message.data);
      this.callMiddleware(xvizData.type, xvizData);
    } else {
      this.log('[> Message] Unknown message: ', JSON.stringify(message, null, 2).slice(0, 100));
    }
  }

  callMiddleware(xvizType, msg = {}) {
    this.info(`[> ${xvizType.toUpperCase()}]`);

    switch (xvizType) {
      case 'start':
        this.middleware.onStart(msg);
        break;
      case 'transform_log':
        this.middleware.onTransformLog(msg);
        break;
      case 'transform_point_in_time':
        this.middleware.onTransformPointInTime(msg);
        break;
      default:
        this.log('[ UNKNOWN] message', xvizType, msg);
        // TODO: send error
        break;
    }
  }
}
