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

/* eslint no-console: ["error", { allow: ["log"] }] */
/* eslint-env node, browser */

// TODO remove these
import {isEnvelope, unpackEnvelope} from '@xviz/parser';
import {XVIZData} from '@xviz/io';

/**
 * Using the provided W3CWebSocket client, send the optional start
 * message de-envelope the messages and push the results through the
 * XVIZ middlewares.
 */
export class WebSocketInterface {
  constructor(options = {}) {
    this.middleware = options.middleware;
    this.start = options.start;
    this.socket = options.socket;
    this.unknownMessageTypes = new Set([]);

    this.socket.onerror = error => {
      console.log('WebSocket Error: ', error);
    };

    this.socket.onclose = () => {
      this.onClose();
    };

    this.socket.onopen = () => {
      this.onConnect();
    };

    this.socket.onmessage = message => {
      this.onMessage(message);
    };
  }

  close() {
    this.socket.close();
  }

  onConnect() {
    this.middleware.onConnect();

    if (this.start) {
      this.sendMessage('start', this.start);
    } else {
      // Start is inline so with no message
      this.middleware.onStart(null);
    }
  }

  onError(error) {
    console.log('Connection Error: ', error.toString());
  }

  onClose(message) {
    this.middleware.onClose();
  }

  onMessage(message) {
    const xvizData = new XVIZData(message.data);
    const parsed = xvizData.message();
    this.processMessage(parsed);
  }

  processMessage(parsed) {
    // TODO: every message should be enveloped
    // ... this means no support for v1?
    if (isEnvelope(parsed)) {
      const unpacked = unpackEnvelope(parsed);

      if (unpacked.namespace === 'xviz') {
        this.callMiddleware(unpacked.type, unpacked.data);
      } else if (!this.unknownMessageTypes.has(parsed.type)) {
        // Report each unknown type just once
        this.unknownMessageTypes.add(parsed.type);
        console.log(`Unknown message namespace: "${unpacked.namespace}" type: "${unpacked.type}"`);
      }
    } else {
      console.log('Unknown message format', parsed);
    }
  }
  sendMessage(msgType, data) {
    this.callMiddleware(msgType, data);

    const enveloped = {
      type: `xviz/${msgType}`,
      data
    };
    this.socket.send(JSON.stringify(enveloped));
  }

  callMiddleware(xvizType, data) {
    switch (xvizType) {
      case 'start':
        this.middleware.onStart(data);
        break;
      case 'error':
        this.middleware.onError(data);
        break;
      case 'metadata':
        this.middleware.onMetadata(data);
        break;
      case 'transform_log':
        this.middleware.onTransformLog(data);
        break;
      case 'state_update':
        this.middleware.onStateUpdate(data);
        break;
      case 'transform_log_done':
        this.middleware.onTransformLogDone(data);
        break;
      default:
        // TODO(jlisee): handle unknown XVIZ message type
        console.log('UNKNOWN XVIZ', xvizType, data);
        break;
    }
  }
}
