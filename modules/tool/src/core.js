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

/**
 * This is a middleware that sends the transform log request
 * after metadata is received.
 */
export class TransformLogFlow {
  constructor(client, options = {}) {
    this.client = client;
    this.options = options;
    this.id = 'f8b38a41-59fa-44b9-9311-cd612886bb37';
    this.sent = false;
  }

  onMetadata(msg) {
    if (!this.sent && !this.options.metadata) {
      const outMsg = {
        id: this.id
      };

      if (this.options.start) {
        outMsg.start_timestamp = this.options.start; // eslint-disable-line camelcase
      }

      if (this.options.end) {
        outMsg.end_timestamp = this.options.end; // eslint-disable-line camelcase
      }

      this.client.sendMessage('transform_log', outMsg);

      this.sent = true;
    }
  }
  onTransformLogDone(msg) {
    this.client.close();
  }
}

/**
 * Close after we have received metadata
 */
export class OnlyMetadata {
  constructor(client) {
    this.client = client;
  }

  onMetadata(msg) {
    this.client.close();
  }
}
