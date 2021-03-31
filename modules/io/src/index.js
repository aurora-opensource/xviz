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
export {XVIZJSONWriter} from './writers/xviz-json-writer';
export {XVIZBinaryWriter, encodeBinaryXVIZ} from './writers/xviz-binary-writer';
export {XVIZProtobufWriter} from './writers/xviz-protobuf-writer';
export {XVIZFormatWriter} from './writers/xviz-format-writer';

export {XVIZJSONReader} from './readers/xviz-json-reader';
export {XVIZBinaryReader} from './readers/xviz-binary-reader';
export {XVIZProtobufReader} from './readers/xviz-protobuf-reader';

export {MemorySourceSink} from './io/memory-source-sink';

export {TextEncoder, TextDecoder} from './common/text-encoding';
export {XVIZData} from './common/xviz-data';
export {XVIZMessage} from './common/xviz-message';
export {XVIZ_MESSAGE_TYPE} from './common/xviz-message-type';
export {XVIZEnvelope} from './common/xviz-envelope';
export {XVIZ_FORMAT, XVIZ_GLTF_EXTENSION, XVIZ_MESSAGE_NAMESPACE} from './common/constants';

export {
  getDataContainer as getDataFormat,
  getDataContainer,
  isEnvelope,
  unpackEnvelope,
  isBinaryXVIZ,
  parseBinaryXVIZ,
  isGLBXVIZ,
  isPBEXVIZ,
  parsePBEXVIZ,
  isJSONString,
  getObjectXVIZType,
  getXVIZMessageType,
  isXVIZMessage
} from './common/loaders';

export {XVIZ_PROTOBUF_MESSAGE} from './common/protobuf-support';

export {XVIZProviderFactory} from './providers/index';
export {XVIZJSONProvider} from './providers/xviz-json-provider';
export {XVIZBinaryProvider} from './providers/xviz-binary-provider';
export {XVIZProtobufProvider} from './providers/xviz-protobuf-provider';
