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

import {WebSocketInterface} from '@xviz/tool';

import test from 'tape-catch';

// TODO share me
const NO_ARGS_METHODS = ['onConnect', 'onClose'];
const METHODS = [
  'onStart',
  'onError',
  'onMetadata',
  'onTransformLog',
  'onStateUpdate',
  'onTransformLogDone'
];

const ALL_METHODS = NO_ARGS_METHODS.concat(METHODS);

// It's a PITA but lets build our little spy objects here
class StoreMiddleware {
  constructor() {
    this.calls = {};

    ALL_METHODS.forEach(methodName => {
      this[methodName] = (...args) => {
        this._storeCall(methodName, args);
      };
    });
  }

  _storeCall(methodName, args) {
    let callList = this.calls[methodName];
    if (callList === undefined) {
      callList = [];
      this.calls[methodName] = callList;
    }
    callList.push(args);
  }
}

class FakeSocket {
  constructor() {
    this.sent = [];
  }

  send(msg) {
    this.sent.push(msg);
  }
}

test('WebSocketInterface#basicDataFlow', t => {
  const middleware = new StoreMiddleware();
  const socket = new FakeSocket();
  const start = {log: 'foo'};

  // Construction does nothing
  // eslint-disable-next-line no-unused-vars
  const w = new WebSocketInterface({socket, middleware, start});
  const calls = {};
  t.deepEquals(calls, middleware.calls, 'No calls on construction');
  t.deepEquals([], socket.sent);

  // Open connection sends start and on connect callback
  socket.onopen();

  calls.onConnect = [[]];
  calls.onStart = [[start]];
  t.deepEquals(calls, middleware.calls, 'Connect calls onConnect');

  // Close sends nothing
  socket.onclose();

  calls.onClose = [[]];
  t.deepEquals(calls, middleware.calls, 'Close calls onClose');

  t.end();
});

test('WebSocketInterface#messageHandling', t => {
  const middleware = new StoreMiddleware();
  const socket = new FakeSocket();
  const start = {log: 'foo'};

  // Construct and connect
  // eslint-disable-next-line no-unused-vars
  const w = new WebSocketInterface({socket, middleware, start});
  socket.onopen();

  // Now send all message types
  const messageTypes = {
    start: 'onStart',
    error: 'onError',
    metadata: 'onMetadata',
    /* eslint-disable camelcase */
    transform_log: 'onTransformLog',
    state_update: 'onStateUpdate',
    transform_log_done: 'onTransformLogDone'
    /* eslint-enable camelcase */
  };

  // Pump each object through, testing results as we go
  Object.keys(messageTypes).forEach(messageType => {
    // Create message
    const methodName = messageTypes[messageType];
    const jsonMsg = {
      type: `xviz/${messageType}`,
      data: {contents: methodName}
    };

    // Setup expected output and clear stored calls
    middleware.calls = {};
    const expected = {};
    expected[methodName] = [[jsonMsg.data]];

    // Send message
    socket.onmessage({data: JSON.stringify(jsonMsg)});

    t.deepEquals(middleware.calls, expected, `Msg ${messageType} routed to ${methodName}`);
  });

  t.end();
});
