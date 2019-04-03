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
import {TextEncoder} from './text-encoding';
import {MemorySink} from '../sinks/memory-sink';
import {XVIZBinaryWriter} from '../writers/xviz-binary-writer';
import {XVIZJSONWriter} from '../writers/xviz-json-writer';

// TODO: how to register and manage options
// TODO: add draco option
export function XVIZFormatter(xvizData, {format}) {
  const formatIn = xvizData.dataFormat();

  if (!format || formatIn === format) {
    // need to check if object() has been called (ie it might be dirty) and repack
    if (!xvizData.hasMessage()) {
      return xvizData.buffer;
    }
  }

  // * => JS object => output with XVIZWriter
  const msg = xvizData.message();
  const sink = new MemorySink();
  let writer = null;
  let suffix = null;
  let id = null;
  switch (format) {
    case 'binary':
      writer = new XVIZBinaryWriter(sink);
      suffix = 'glb';
      break;
    case 'json_buffer':
    case 'json_string':
      writer = new XVIZJSONWriter(sink);
      suffix = 'json';
      break;
    default:
      throw new Error(`Cannot convert XVIZData to format ${format}`);
  }

  if (msg.type === 'metadata') {
    id = 1;
    writer.writeMetadata(msg.data);
  } else {
    id = 3;
    writer.writeFrame(1, msg.data);
  }

  let result = sink.get(`${id}-frame.${suffix}`);
  if (format === 'json_buffer') {
    const encoder = new TextEncoder();
    result = encoder.encode(result);
  }

  return result;
}
