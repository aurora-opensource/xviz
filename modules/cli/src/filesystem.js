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

import {XVIZProviderFactory} from '@xviz/io';
import {FileSource} from '@xviz/io/node';

/**
 * Use the provider to push the data through
 * the XVIZ middleware.
 */
export class FileSystemInterface {
  constructor(options = {}) {
    this.options = options;
    this.middleware = options.middleware;
  }

  async open(path) {
    const source = new FileSource(path);

    const provider = await XVIZProviderFactory.open({
      source,
      options: {}
    });

    if (provider) {
      this._processLog(provider);
    }
  }

  async _processLog(provider) {
    const options = {};
    if (this.options.start || this.options.end) {
      const {start, end} = this.options;
      if (Number.isFinite(start)) {
        options.startTime = start;
      }
      if (Number.isFinite(end)) {
        options.endTime = end;
      }
    }

    const metadata = provider.xvizMetadata();
    this.middleware.onMetadata(metadata.message().data);

    const iterator = provider.getMessageIterator(options);
    while (iterator.valid()) {
      const msg = await provider.xvizMessage(iterator);
      if (msg) {
        this.middleware.onStateUpdate(msg.message().data);
      }
    }

    this.onClose();
  }

  onClose(message) {
    this.middleware.onClose();
  }
}
