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

// XVIZFilesSession sends local files out the socket
export class XVIZFilesSession {
  constructor(socket, request, source, options) {
    this.socket = socket;
    this.request = request;
    this.source = source;
    this.options = options;

    this._setupSocket();
  }

  log(msg, ...args) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(`${msg}`, ...args);
    }
  }

  info(...msg) {
    const {logger} = this.options;
    if (logger && logger.info) {
      logger.info(...msg);
    }
  }

  _setupSocket() {
    this.socket.onerror = err => {
      this._onSocketError(err);
    };

    this.socket.onclose = event => {
      this._onSocketClose(event);
    };

    this.socket.onopen = () => {
      this._onSocketOpen();
    };

    this.socket.onmessage = message => {
      this._onSocketMessage(message);
    };
  }

  _onSocketOpen() {
    this.log('[> Socket] Open');
  }

  _onSocketError(error) {
    this.log('[> Socket] Error: ', error.toString());
  }

  _onSocketClose(event) {
    this.log(`[> Socket] Close: Code ${event.code} Reason: ${event.reason}`);
  }

  _onSocketMessage(message) {
    this.socket.send(message.data);
  }

  onConnect() {
    this.log('[> Connection] made');
    let fileNumber = 2;
    const sender = () => {
      if (!this.source.existsSync(`${fileNumber}-frame.pbe`)) {
        fileNumber = 2;
      }

      this.socket.send(this.source.readSync(`${fileNumber}-frame.pbe`));
      fileNumber++;
    };

    setInterval(sender, 50); 
  }
}
