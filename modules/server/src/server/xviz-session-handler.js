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
/* global console */
/* eslint-disable no-console */
import {isXVIZMessage} from '@xviz/parser';
import {XVIZData} from '@xviz/io';

import {XVIZRequestHandler} from '../middlewares/xviz-request-handler';
import {XVIZWebsocketSender} from '../middlewares/xviz-websocket-sender';

import {XVIZServerMiddlewareStack} from '../middlewares/middleware';

// XVIZSessionHandler handles the socket and dispatching to the middleware
//
// anyone else can add their own session
// - Would someone want to "mix" sessions?
// - if so they just create a wrapper that if XVIZ session is happy
//   they can attach to it and proxy as necessary
// - say they want to handle xvIZ data, but then want to mutate or
//   add data (custom) for messages, they could try to handle first,
//   else send to XVIZ
export class XVIZSessionHandler {
  constructor(socket, request, provider, options) {
    this.socket = socket;
    this.request = request;
    this.provider = provider;
    this.options = options;

    // A place to store state for the middlewares for this session
    this.context = {};

    this.middleware = null;

    this._setupSocket();
    this._setupMiddleware();
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
      new XVIZRequestHandler(this.context, this.socket, this.provider, this.middleware, this.options),
      new XVIZWebsocketSender(this.context, this.socket, this.options)
    ];
    this.middleware.set(stack);
  }

  onOpen() {
    console.log('[> Connection] Open');
  }

  onError(error) {
    console.log('[> Connection] Error: ', error.toString());
  }

  onClose(event) {
    console.log(`[> Connection] Close: Code ${event.code} Reason: ${event.reason}`);
  }

  onConnection() {
    console.log('[> Connection] made', this.request);

    const params = this.request.params;
    if (!params.version) {
      // Assume default connection
      params.version = '2.0';
    }

    this.callMiddleware('start', params);

    // if live, would send metadata & stream before
    // middleware, on live would send data
    // send metadata
    // if live sendPlayResp
    this.callMiddleware('transform_log', {id: 'live'});
  }

  onMessage(message) {
    if (isXVIZMessage(message.data)) {
      // Since this is the server we assume the message
      // we get is simple and instantiate the message immediately
      // We also need to do this to get the "type()"
      const xvizData = new XVIZData(message.data);

      // TODO: I need to get the type w/o instantiating the message()
      // need to add this to binary/glb parsing
      const xvizObj = xvizData.message();
      this.callMiddleware(xvizObj.type, xvizObj.data);
    } else {
      console.log('[> Message] Unknown message: ', JSON.stringify(message, null, 2).slice(0, 100));
    }
  }

  callMiddleware(xvizType, req = {}, data = {}) {
    switch (xvizType) {
      case 'start':
        this.middleware.onStart(req, data);
        break;
      case 'transform_log':
        this.middleware.onTransformLog(req, data);
        break;
      case 'transform_point_in_time':
        this.middleware.onTransformPointInTime(req, data);
        break;
      default:
        console.log('[ UNKNOWN] message', xvizType, data);
        break;
    }
  }
}
