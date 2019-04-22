// Copyright (c) 2019 Uber Technologies, Inc.
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
/* eslint no-console: ["error", { allow: ["log"] }] */

import fs from 'fs';

import {XVIZFormat, XVIZFormatWriter, FileSource, FileSink} from '@xviz/io';
import {XVIZProviderFactory} from '@xviz/io';

export const ConvertFormat = Object.freeze({
  JSON: 'json',
  BINARY: 'binary'
});

/**
 * XVIZ middleware that converts to another format
 */
export class ConvertXVIZ {
  constructor(src, dst, options = {}) {
    this.src = src;
    this.dst = dst;
    this.options = options;

    // eslint-disable-next-line no-console
    this.log = options.log || console.log;
  }

  async setup() {
    this.log(`checking ${this.src}`);
    if (!fs.existsSync(this.src)) {
      throw new Error('No source directory found');
    }
    const source = new FileSource(this.src);

    this.log(`checking ${this.dst}`);
    if (!fs.existsSync(this.dst)) {
      this.log(`making ${this.dst}`);
      fs.mkdirSync(this.dst);
    }
    this.sink = new FileSink(this.dst);

    const provider = await XVIZProviderFactory.open({
      source,
      options: this.options,
      root: this.src
    });

    this.log(`checking factory`);
    if (!provider) {
      throw new Error('No valid XVIZ data provider found');
    }
    this.provider = provider;
  }

  getIterator() {
    const {start, end} = this.options;
    return this.provider.getFrameIterator(start, end);
  }

  async process() {
    if (!this.provider || !this.sink) {
      this.log(`missing source | sink`);
      throw new Error('No valid source and sink');
    }

    const metadata = this.provider.xvizMetadata();
    if (!metadata) {
      throw new Error('No metadata');
    }

    const sinkFormat =
      this.options.format === ConvertFormat.JSON ? XVIZFormat.jsonString : XVIZFormat.binary;
    const optimize = Boolean(this.options.optimize);

    const writer = new XVIZFormatWriter(this.sink, {format: sinkFormat, flattenArrays: optimize});
    writer.writeMetadata(metadata);

    const iterator = this.getIterator();
    let frameSequence = 0;
    while (iterator.valid()) {
      const data = await this.provider.xvizFrame(iterator);
      if (!data) {
        throw new Error(`No data for frame ${frameSequence}`);
      }

      process.stdout.write(`Writing frame ${frameSequence}\r`);
      writer.writeFrame(frameSequence, data);
      frameSequence += 1;
    }

    writer.writeFrameIndex();
  }
}
