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
    case XVIZFormat.BINARY:
      writer = new XVIZBinaryWriter(sink);
      break;
    case XVIZFormat.JSON_BUFFER:
      writer = new XVIZJSONBufferWriter(sink);
      break;
    case XVIZFormat.JSON_STRING:
      writer = new XVIZJSONWriter(sink);
      break;
    default:
      throw new Error(`Cannot convert XVIZData to format ${format}`);
  }

  return writer;
}

// Convert XVIZData to a different XVIZFormat
export class XVIZFormatWriter {
  constructor(sink, {format}) {
    this.format = format;
    this.sink = sink;

    if (format === XVIZFormat.OBJECT) {
      throw new Error('XVIZFormat.OBJECT is not supported by XVIZFormatter.');
    }

    this.writer = determineWriter(sink, format);
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

  close() {
    this.sink.close();
  }
}
