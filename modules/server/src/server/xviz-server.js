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
const URL = require('url').URL;
const WebSocket = require('ws');

// Extract path and params from the request
function getRequestData(requestUrl) {
  const req = new URL(requestUrl, 'https://localhost');
  const params = {};
  for (const [k, v] of req.searchParams.entries()) {
    params[k] = v;
  }

  return {
    path: req.pathname,
    params
  };
}

// TODO: Allow a client supplied server to be used
//       so clients can control routes
const DEFAULT_OPTIONS = {
  port: 3000,
  perMessageDeflate: true,
  maxPayload: 64 * 1024 * 1024 // 64MiB
};

export class XVIZServer {
  constructor(handlers, options, callback) {
    if (!handlers) {
      throw new Error('Must specify a handler for messages');
    }

    this.handlers = handlers;
    this.options = Object.assign(DEFAULT_OPTIONS, options);
    this._server = new WebSocket.Server(this.options, callback);

    this.server.on('connection', (socket, request) => this.handleSession(socket, request));
  }

  get server() {
    return this._server;
  }

  close(cb) {
    this._server.close(cb);
  }

  async handleSession(socket, request) {
    this.log(`[> Connection] created: ${request.url}`);
    const req = getRequestData(request.url);

    for (const handler of this.handlers) {
      const session = await handler.newSession(socket, req);
      if (session) {
        session.onConnect();
        return;
      }
    }

    // TODO: send XVIZ error and close connection
    socket.close();
    this.log('[> Connection] closed due to no handler found');
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }
}
