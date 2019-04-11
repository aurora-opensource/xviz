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
import {XVIZJSONWriter} from '../writers/xviz-json-writer';
import {XVIZFormat} from './constants';

// Convenience class for Formatting JSON String vs ArrayBuffer
class XVIZJSONBufferWriter extends XVIZJSONWriter {
  constructor(sink, options) {
    super(sink, {...options, asArrayBuffer: true});
  }
}

// Convert an XVIZData to a different XVIZFormat.
export function XVIZFormatter(xvizData, targetFormat, sink, {frame = 0} = {}) {
  if (targetFormat === XVIZFormat.object) {
    throw new Error('XVIZFormat.object is not supported by XVIZFormatter.');
  }

  const sourceFormat = xvizData.dataFormat();

  if (!targetFormat || sourceFormat === targetFormat) {
    // need to check if object() has been called (ie it might be dirty) and repack
    if (!xvizData.hasMessage()) {
      return xvizData.buffer;
    }
  }

  let writer = null;
  switch (targetFormat) {
    case XVIZFormat.binary:
      writer = new XVIZBinaryWriter(sink);
      break;
    case XVIZFormat.jsonBuffer:
      writer = new XVIZJSONBufferWriter(sink);
      break;
    case XVIZFormat.jsonString:
      writer = new XVIZJSONWriter(sink);
      break;
    default:
      throw new Error(`Cannot convert XVIZData to format ${targetFormat}`);
  }

  const msg = xvizData.message();

  if (msg.type === 'metadata') {
    writer.writeMetadata(msg.data);
  } else if (msg.type === 'state_update') {
    writer.writeFrame(frame, msg.data);
  } else {
    throw new Error(`Message type ${msg.type} is not handled by XVIZFormatter`);
  }
}
