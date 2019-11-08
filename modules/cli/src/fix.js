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

/* eslint-env node, browser */
/* eslint-disable camelcase */
import {isPath} from './connect';

import {FileSource, FileSink} from '@xviz/io/node';
// TODO: replace this with XVIZReaderFactory
import {XVIZJSONReader, XVIZBinaryReader, XVIZProtobufReader, XVIZData} from '@xviz/io';

/**
 * XVIZ command that correct issues with an XVIZ log
 * - create index file
 * - if no metadata file, create one
 *   - minimal
 *   - populate streams
 */
export class FixXVIZ {
  constructor(options = {}) {
    // eslint-disable-next-line no-console
    this.log = options.log || console.log;
    this.source = options.source;
  }

  _fixIndex(reader) {
    this.log('Reconstructing index file...');
    const sink = new FileSink(this.source);
    let n = 0;
    const timing = [];

    while (reader.checkMessage(n)) {
      const msg = reader.readMessage(n);
      const idx = n;
      n++;

      const data = new XVIZData(msg);
      // TODO(twojtasz): fix protobuf data.type determination
      if (data.type === 'state_update') {
        const message = data.message().data;
        const length = message.updates.length;
        timing.push([
          message.updates[0].timestamp,
          message.updates[length - 1].timestamp,
          idx,
          `${idx + 2}-frame`
        ]);
      }
    }

    if (timing.length > 0) {
      const index = {
        startTime: timing[0][0],
        endTime: timing[timing.length - 1][0],
        timing
      };

      sink.writeSync('0-frame.json', JSON.stringify(index));
      this.log('Index file written');
    } else {
      this.log('Index timing information not found');
    }
  }

  _fixMetadata(reader) {
    this.log('Writing minimal metadata');

    const minimalMetadata = {
      type: 'xviz/metadata',
      data: {
        version: '2.0.0'
      }
    };

    const timeRange = reader.timeRange();

    if (!timeRange.startTime || !timeRange.endTime) {
      throw new Error(
        'Failed to fix metadata due to missing index with startTime and endTime entries'
      );
    }
    minimalMetadata.data.log_info = {
      start_time: timeRange.startTime,
      end_time: timeRange.endTime
    };

    const sink = new FileSink(this.source);
    sink.writeSync('1-frame.json', JSON.stringify(minimalMetadata));
  }

  fix() {
    //  this.log(`${header} ${data}`);
    if (isPath(this.source)) {
      const source = new FileSource(this.source);

      const pb_reader = new XVIZProtobufReader(source);
      const json_reader = new XVIZJSONReader(source);
      const glb_reader = new XVIZBinaryReader(source);
      const reader = [pb_reader, json_reader, glb_reader].find(rdr => rdr.checkMessage(0));

      if (!reader) {
        this.log(`The path ${this.source} is not valid for current supported XVIZ Readers.`);
      } else {
        // Check for messageCount, and if undefined write out index.
        if (reader.messageCount() === undefined) {
          this._fixIndex(reader);
        }

        if (reader.readMetadata() === undefined) {
          this._fixMetadata(reader);
        }
        reader.close();
      }
    } else {
      this.log(`The fix cmd only works with paths and ${this.source} is not a valid path.`);
    }
  }
}
