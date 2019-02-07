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

/* eslint-env node */
/* eslint no-console: ["error", { allow: ["log"] }] */

import {XVIZMiddlewareStack} from './middleware';
import {WebSocketInterface} from './websocket';
import {TransformLogFlow, OnlyMetadata} from './core';

const W3CWebSocket = require('websocket').w3cwebsocket;

/**
 * With the given arguments open an XVIZ data source and process with
 * the provided middleware stack.  Additional middleware is added to
 * facilitate processing as needed.
 */
export function openSource(args, middlewares) {
  // Non-live sessions require sending a transform log message
  if (!isLive(args)) {
    middlewares.push(new TransformLogFlow(null, args));
  }

  // If we just want metadata we shutdown afterwards
  if (args.metadata) {
    middlewares.push(new OnlyMetadata(null));
  }

  // Assemble our message processors
  const socket = webSocketFromArgs(args);
  const stackedMiddleware = new XVIZMiddlewareStack(middlewares);

  const client = new WebSocketInterface({middleware: stackedMiddleware, socket});

  // Some middleware needs to be able to send messages/close connections
  // so provide them access to the client.
  for (let i = 0; i < middlewares.length; ++i) {
    const middleware = middlewares[i];
    if (middleware.client === null) {
      middleware.client = client;
    }
  }

  // Setup graceful shutdown
  let sigintCount = 0;
  process.on('SIGINT', () => {
    if (sigintCount === 0) {
      console.log('Closing');
      socket.close();
    } else {
      // If the user or system is really mashing Ctrl-C, then abort
      console.log('Aborting');
      process.exit(1); // eslint-disable-line no-process-exit
    }

    sigintCount++;
  });

  return client;
}

/**
 * Take the standard data args and return a working websocket
 */
export function webSocketFromArgs(args) {
  const url = urlFromArgs(args);
  return createWebSocket(url);
}

/**
 * Arg we operating a live session or not
 */
export function isLive(args) {
  return args.log === undefined;
}

/**
 * Based on the command data arguments create a standard XVIZ service URL
 */
export function urlFromArgs(args) {
  const extraArgs = isLive(args) ? 'session_type=live' : `log=${args.log}`;
  const url = `${args.host}?version=2.0&${extraArgs}`;

  return url;
}

/**
 * Create a web socket properly configured for large XVIZ data flows
 */
export function createWebSocket(url) {
  const client = new W3CWebSocket(
    url,
    null, // protocols
    null, // origin
    null, // headers
    null, // requestOptions
    {
      maxReceivedFrameSize: 64 * 1024 * 1024, // 64MiB
      maxReceivedMessageSize: 64 * 1024 * 1024 // 64MiB
    }
  );

  return client;
}
