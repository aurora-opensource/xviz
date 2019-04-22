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
import {XVIZBinaryWriter} from '../writers/xviz-binary-writer';
import {XVIZJSONWriter} from '../writers/xviz-json-writer';
import {XVIZFormat} from '../common/constants';

// Convenience class for Formatting JSON String vs ArrayBuffer
class XVIZJSONBufferWriter extends XVIZJSONWriter {
  constructor(sink, options) {
    super(sink, {...options, asArrayBuffer: true});
  }
}

function determineWriter(sink, format, options) {
  let writer = null;
  switch (format) {
    case XVIZFormat.binary:
      writer = new XVIZBinaryWriter(sink, options);
      break;
    case XVIZFormat.jsonBuffer:
      writer = new XVIZJSONBufferWriter(sink, options);
      break;
    case XVIZFormat.jsonString:
      writer = new XVIZJSONWriter(sink, options);
      break;
    default:
      throw new Error(`Cannot convert XVIZData to format ${format}`);
  }

  return writer;
}

// Convert XVIZData to a different XVIZFormat
export class XVIZFormatWriter {
  constructor(sink, options = {}) {
    this.options = Object.assign({format: XVIZFormat.binary, flattenArrays: false}, options);
    this.options = options;
    this.sink = sink;

    if (this.options.format === XVIZFormat.object) {
      throw new Error('XVIZFormat.object is not supported by XVIZFormatter.');
    }

    this.writer = determineWriter(sink, this.options.format, this.options);
  }

  writeMetadata(xvizMetadata) {
    const msg = xvizMetadata.message();
    this.writer.writeMetadata(msg.data);
  }

  writeFrame(frameIndex, xvizData) {
    const msg = xvizData.message();
    this.writer.writeFrame(frameIndex, msg.data);
  }

  writeFrameIndex() {
    this.writer.writeFrameIndex();
  }
}
