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
import {XVIZFormatter} from '@xviz/io';

// Send message through the websocket taking into account
// that only string and arraybuffer data can be sent.
//
// Only stateUpdates are sent as binary, everything else
// is assumed to just be JSON strings (generally short ones).
//
export class XVIZWebsocketSender {
  constructor(context, socket, options) {
    this.context = context;
    this.socket = socket;

    // TODO: options register:
    // - compress
    // - formatter

    this.options = options;
    // Websocket needs string or buffer
    // TODO: should this throw instead
    if (this.options.format === 'object') {
      this.options.format = 'json_string';
    }
  }

  _getFormatOptions(msg) {
    // default should be pass-thru of original data
    if (!this.options.format) {
      // If no format is specified, we need to ensure we send a
      // string or arraybuffer through the websocket

      // Test to determine if msg is either string or arraybuffer
      if (
        msg.data.dataFormat() === 'object' ||
        (!msg.data.hasMessage() &&
          typeof msg.data.buffer !== 'string' &&
          !msg.data.buffer.byteLength)
      ) {
        return {...this.options, format: 'json_string'};
      }
    }

    return this.options;
  }

  _getOpts(resp) {
    const opts = {compress: false};
    if (typeof resp === 'string') {
      opts.compress = true;
    }

    return opts;
  }

  onError(req, msg) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const resp = JSON.stringify(msg.data.buffer);
    this.socket.send(resp, this._getOpts(resp));
  }

  onMetadata(req, msg) {
    const resp = XVIZFormatter(msg.data, this._getFormatOptions(msg));
    this.socket.send(resp, this._getOpts(resp));
  }

  onStateUpdate(req, msg) {
    const resp = XVIZFormatter(msg.data, this._getFormatOptions(msg));
    this.socket.send(resp, this._getOpts(resp));
  }

  onTransformLogDone(req, msg) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const resp = JSON.stringify(msg.data.buffer);
    this.socket.send(resp, this._getOpts(resp));
  }
}
