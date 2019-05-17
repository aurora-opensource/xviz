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
import {XVIZFormat, XVIZFormatWriter} from '@xviz/io';

export class WebsocketSink {
  constructor(socket, options) {
    this.socket = socket;
    this.options = options;
  }

  writeSync(name, data) {
    let {compress = false} = this.options;
    if (typeof data === 'string') {
      compress = true;
    }

    this.socket.send(data, {compress});
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
    this.sink = new WebsocketSink(socket, options);

    // TODO: options register:
    // - compress
    // - formatter

    this.options = options;

    // This is the actual format we use to send data and can change
    // based on the message.
    this.format = options.format;

    if (this.format === XVIZFormat.OBJECT) {
      // We can not output OBJECT on a websocket
      this.format = XVIZFormat.BINARY;
    }

    this.writer = null;
    // If format is undefined we want to send the 'natural' format of
    // the data (as long as it's not an OBJECT).
    // Keep track of current 'writer' format
    this.writerFormat = null;

    this._syncFormatWithWriter(this.format);
  }

  log(...msg) {
    const {logger} = this.options;
    logger.log(...msg);
  }

  // Sets this.writer based on 'format'
  _syncFormatWithWriter(format) {
    // Cover the case where we have a format and no writer or when the
    // format does not match.
    if (format && (!this.writer || this.writerFormat !== format)) {
      this.writer = new XVIZFormatWriter(this.sink, {format});
      this.writerFormat = format;
    }
  }

  // Data is in the desired format and can be written to sink directly
  _sendDataDirect(format, resp) {
    // if format === sourceFormat &&
    // resp.data.
    //
    const sourceFormat = resp.data.format;

    // need to check if object() has been called (ie it might be dirty) and repack
    if (format === sourceFormat && !resp.data.hasMessage()) {
      return true;
    }

    return false;
  }

  // If the format is unspecified we output the 'natural' format
  // if it is valid. Make that determination here.
  _getFormatOptions(msg) {
    // default should be pass-thru of original data
    if (!this.format) {
      // If no format is specified, we send the 'natural' format
      // but it must be a string or arraybuffer, not an OBJECT

      // Test to determine if msg is either string or arraybuffer
      if (
        msg.data.format === XVIZFormat.OBJECT ||
        (!msg.data.hasMessage() &&
          typeof msg.data.buffer !== 'string' &&
          !msg.data.buffer.byteLength)
      ) {
        return XVIZFormat.BINARY;
      }

      // return the format set to the current data format
      return msg.data.format;
    }

    return this.format;
  }

  onError(req, resp) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const response = JSON.stringify(resp.data.buffer);
    this.sink.writeSync('error', response);
  }

  onMetadata(req, resp) {
    const format = this._getFormatOptions(resp);

    if (this._sendDataDirect(format, resp)) {
      this.sink.writeSync(`1-frame`, resp.data.buffer);
    } else {
      this._syncFormatWithWriter(format);
      this.writer.writeMetadata(resp.data);
    }
  }

  onStateUpdate(req, resp) {
    const format = this._getFormatOptions(resp);

    if (this._sendDataDirect(format, resp)) {
      this.sink.writeSync('2-frame', resp.data.buffer);
    } else {
      this._syncFormatWithWriter(format);
      this.writer.writeFrame(0, resp.data);
    }
  }

  onTransformLogDone(req, resp) {
    // TODO: This message is almost always just a plain object
    // but the special handling for here feels awkard
    const response = JSON.stringify(resp.data.buffer);
    this.sink.writeSync('done', response);
  }
}
