// Copyright (c) 2019 Uber Technologies, Inc.  //
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

/* eslint-env node, browser */
/* eslint-disable no-console */
import fs from 'fs';
import {XVIZ_FORMAT, XVIZFormatWriter} from '@xviz/io';
import {XVIZData} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

/**
 * XVIZ middleware that echos all messages, with configurable level of
 * details.
 */
export class SaveXVIZ {
  constructor(options = {}) {
    // eslint-disable-next-line no-console
    this.log = options.log || console.log;
    this.output = options.output;

    if (!fs.existsSync(this.output)) {
      fs.mkdirSync(this.output);
    }

    this.format = XVIZ_FORMAT.BINARY_PBE;
    this.sink = new FileSink(this.output);
    this.writer = new XVIZFormatWriter(this.sink, {format: this.format});
    this.count = 0;

    process.on('SIGINT', () => {
      console.log('Aborting, writing index file.');
      this.writer.close();
    });
  }

  onMetadata(msg) {
    const data = new XVIZData(msg);
    this.writer.writeMetadata(data);
    this.log('[METADATA]');
  }

  onStateUpdate(msg) {
    const data = new XVIZData(msg);
    this.writer.writeMessage(this.count, data);
    this.log('[Msg]', this.count);
    this.count++;
  }

  onClose() {
    this.writer.close();
  }
}
