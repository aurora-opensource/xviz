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

import WebSocket from 'ws';
import {XVIZMessageToMiddleware} from '@xviz/server';
import {XVIZData} from '@xviz/io';

// Iterate goes [start, end] by 1
class TestIterator {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.v = start;
  }

  valid() {
    return this.v <= this.end;
  }

  value() {
    return this.v;
  }

  next() {
    const v = this.v;
    this.v++;
    return v;
  }
}

// Provider on top of given metadata and messages
export class TestProvider {
  constructor({metadata, messages}) {
    this.metadata = metadata;
    this.messages = messages;

    const firstMsg = this.messages[0];
    this.start_time = firstMsg.data.updates[0].timestamp;

    const lastMsg = this.messages[this.messages.length - 1];
    this.end_time = lastMsg.data.updates[0].timestamp;
  }

  xvizMetadata() {
    return new XVIZData(this.metadata);
  }

  getMessageIterator({startTime, endTime} = {}) {
    return new TestIterator(startTime, endTime);
  }

  xvizMessage(iter) {
    const value = iter.next();
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      if (msg.data.updates[0].timestamp >= value) {
        return new XVIZData(this.messages[i]);
      }
    }

    return null;
  }
}

// Session that delegates to provided middleware
export class TestSession {
  constructor(socket, middleware) {
    this.socket = socket;
    this.middleware = middleware;
    this.handler = new XVIZMessageToMiddleware(middleware);

    this.socket.onmessage = message => this.onMessage(message);
    this.socket.onclose = message => this.onClose();
  }

  // Called by handler
  onConnect() {
    this.handler.callMiddleware('connect');
  }

  // Socket events
  onClose() {
    this.handler.callMiddleware('close');
  }

  onMessage(msg) {
    this.handler.onMessage(msg);
  }
}

// Hands off session making to sessionMaker
export class TestHandler {
  constructor(sessionMaker) {
    this.sessionMaker = sessionMaker;
  }

  newSession(socket, req) {
    return this.sessionMaker(socket, req);
  }
}

// Connects to localhost:${wss.sever.address().port}/path?params
// wss - Web Socket Server object
// path - string, ex: 'log-name'
// params - object, will be converted to ?foo=bar&bar=baz
// msg - XVIZ message to be sent if provided
//
// returns socket to subscribe to message sent back
export function connect(wss, {path, params, msg}) {
  let queryParams = null;
  if (params) {
    queryParams = Object.entries(params)
      .map(p => p.join('='))
      .join('&');
  }

  let url = `ws://localhost:${wss.server.address().port}`;
  if (path) {
    url += path;
  }
  if (queryParams) {
    url += `?${queryParams}`;
  }

  const socket = new WebSocket(url);
  return socket;
}

export function makeXVIZData(start, end) {
  const metadata = {
    type: 'xviz/metadata',
    data: {
      version: '2.0.0',
      log_info: {
        start_time: start,
        end_time: end
      },
      streams: {
        ['/vehicle_pose']: {},
        ['/test/stream1']: {}
      }
    }
  };

  const messages = [];
  for (let i = start; i <= end; i++) {
    messages.push({
      type: 'xviz/state_update',
      data: {
        update_type: 'snapshot',
        updates: [
          {
            timestamp: i,

            poses: {
              '/vehicle_pose': {
                timestamp: start,
                orientation: [0, 0, 0],
                position: [0, 0, 0]
              }
            },
            primitives: {
              ['/circle']: {
                circles: [
                  {
                    center: [0.0, 0.0, 0.0],
                    radius: 5 + i
                  }
                ]
              }
            }
          }
        ]
      }
    });
  }

  return {metadata, messages};
}

export class TestClient {
  constructor(socket, testSequence, done) {
    this.socket = socket;
    this.testSequence = testSequence;
    this.done = done;
    this.index = 0;

    this.socket.onopen = () => this.onOpen();
    this.socket.onmessage = msg => this.onMessage(msg);
  }

  onOpen() {
    this.testValidation();
  }

  onMessage(message) {
    const msg = new XVIZData(message.data);
    this.testValidation(msg);
  }

  _send(msg) {
    this.socket.send(JSON.stringify(msg));
  }

  testValidation(msg) {
    const {expect, response} = this.testSequence[this.index];
    this.index += 1;

    if (expect) {
      expect(msg);
    }

    if (response) {
      this._send(response);
    }

    if (this.index === this.testSequence.length) {
      if (this.done) {
        this.done();
      }
    }
  }
}

export class MiddlewareEcho {
  constructor(prefix, log) {
    this.prefix = prefix;
    this.log = log;
  }

  // Receiving Messages
  onStart(msg) {
    this.log(`${this.prefix} onStart`);
  }

  onTransformLog(msg) {
    this.log(`${this.prefix} onTransformLog`);
  }

  // Sending Messages
  onMetadata(msg) {
    this.log(`${this.prefix} onMetadata`);
  }

  onStateUpdate(msg) {
    this.log(`${this.prefix} onStateUpdate`);
  }

  onTransformLogDone(msg) {
    this.log(`${this.prefix} onTransformLogDone`);
  }

  onError(msg) {
    this.log(`${this.prefix} onError`);
  }
}

export class TestLogger {
  constructor() {
    this.log = [];
  }

  _append(level, log) {
    this.log.push({level, log});
  }

  log(...args) {
    this._append('log', args);
  }

  info(...args) {
    this._append('log', args);
  }

  warn(...args) {
    this._append('log', args);
  }

  error(...args) {
    this._append('log', args);
  }

  verbose(...args) {
    this._append('log', args);
  }

  count(level) {
    if (level) {
      return this.log.filter(x => level === x.level).length;
    }

    return this.log.length;
  }

  logs(level) {
    if (level) {
      return this.log.filter(x => level === x.level);
    }

    return this.log;
  }
}
