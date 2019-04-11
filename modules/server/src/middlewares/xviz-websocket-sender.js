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
import {XVIZFormat, XVIZFormatter} from '@xviz/io';

export class WebsocketSink {
  constructor(socket) {
    this.socket = socket;
  }

  writeSync(name, data) {
    const opts = {compress: false};
    if (typeof data === 'string') {
      opts.compress = true;
    }

    this.socket.send(data, opts);
  }
}

// Send message through the websocket taking into account
// that only string and arraybuffer data can be sent.
//
// Only stateUpdates are sent as binary, everything else
// is assumed to just be JSON strings (generally short ones).
//
export class XVIZWebsocketSender {
  constructor(context, socket, options = {}) {
    this.context = context;
    this.socket = socket;
    this.sink = new WebsocketSink(socket, options.format);

    // TODO: options register:
    // - compress
    // - formatter

    this.options = options;
    if (this.options.format === XVIZFormat.object) {
      this.options.format = XVIZFormat.jsonString;
    }
  }

  _getFormatOptions(msg) {
    // default should be pass-thru of original data
    if (!this.options.format) {
      // If no format is specified, we need to ensure we send a
      // string or arraybuffer through the websocket

      // Test to determine if msg is either string or arraybuffer
      if (
        msg.data.dataFormat() === XVIZFormat.object ||
        (!msg.data.hasMessage() &&
          typeof msg.data.buffer !== 'string' &&
          !msg.data.buffer.byteLength)
      ) {
        return {...this.options, format: XVIZFormat.jsonString};
      }

      // return the format set to the current data format
      return {...this.options, format: msg.data.dataFormat()};
    }

    return this.options;
  }

  onError(req, msg) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const resp = JSON.stringify(msg.data.buffer);
    this.sink.writeSync('error', resp);
  }

  onMetadata(req, msg) {
    const {format} = this._getFormatOptions(msg);
    XVIZFormatter(msg.data, format, this.sink);
  }

  onStateUpdate(req, msg) {
    const {format} = this._getFormatOptions(msg);
    XVIZFormatter(msg.data, format, this.sink);
  }

  onTransformLogDone(req, msg) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const resp = JSON.stringify(msg.data.buffer);
    this.sink.writeSync('done', resp);
  }
}
