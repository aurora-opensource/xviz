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
import {XVIZBinaryWriter} from '../writers/xviz-binary-writer';
import {XVIZProtobufWriter} from '../writers/xviz-protobuf-writer';
import {XVIZJSONWriter} from '../writers/xviz-json-writer';
import {XVIZ_FORMAT} from '../common/constants';

// Convenience class for Formatting JSON String vs ArrayBuffer
class XVIZJSONBufferWriter extends XVIZJSONWriter {
  constructor(sink, options) {
    super(sink, {...options, asArrayBuffer: true});
  }
}

function determineWriter(sink, format, options) {
  let writer = null;
  switch (format) {
    case XVIZ_FORMAT.BINARY_GLB:
      writer = new XVIZBinaryWriter(sink, options);
      break;
    case XVIZ_FORMAT.BINARY_PBE:
      writer = new XVIZProtobufWriter(sink, options);
      break;
    case XVIZ_FORMAT.JSON_BUFFER:
      writer = new XVIZJSONBufferWriter(sink, options);
      break;
    case XVIZ_FORMAT.JSON_STRING:
      writer = new XVIZJSONWriter(sink, options);
      break;
    default:
      throw new Error(`Cannot convert XVIZData to format ${format}`);
  }

  return writer;
}

// Convert XVIZData to a different XVIZ_FORMAT
export class XVIZFormatWriter {
  constructor(sink, {format, ...options}) {
    this.format = format;
    this.options = {flattenArrays: true, ...options};

    if (!format || format === XVIZ_FORMAT.OBJECT) {
      throw new Error(`Format ${format} is not supported by XVIZFormatter.`);
    }

    this.writer = determineWriter(sink, format, this.options);
  }

  writeMetadata(xvizMetadata) {
    const msg = xvizMetadata.message();
    this.writer.writeMetadata(msg.data);
  }

  writeMessage(messageIndex, xvizData) {
    const msg = xvizData.message();
    this.writer.writeMessage(messageIndex, msg.data);
  }

  close() {
    this.writer.close();
  }
}
