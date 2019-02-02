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

import {isEnvelope, unpackEnvelope} from '@xviz/parser';
import {parseBinaryXVIZ, isBinaryXVIZ} from '@xviz/parser/loaders/xviz-loader/xviz-binary-loader';

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
    if (typeof message.data !== 'string') {
      if (isBinaryXVIZ(message.data)) {
        // Convert from binary to JSON object
        const parsed = parseBinaryXVIZ(message.data);
        this.processMessage(parsed);
      }
    } else {
      const parsed = JSON.parse(message.data);
      this.processMessage(parsed);
    }
  }

  processMessage(parsed) {
    // TODO(jlisee): handle unknown namespace and messages
    if (isEnvelope(parsed)) {
      const unpacked = unpackEnvelope(parsed);

      if (unpacked.namespace === 'xviz') {
        this.callMiddleware(unpacked.type, unpacked.data);
      } else {
        console.log('UNKNOWN NAMESPACE', unpacked.namespace);
      }
    } else {
      console.log('UNKNOWN MESSAGE', parsed);
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
