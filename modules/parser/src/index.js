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

// Stats object for perf measurement
export {default as xvizStats} from './utils/stats';

// GENERIC XVIZ EXPORTS

// Common constants
export {XVIZ_MESSAGE_TYPE} from './constants';

// Configuration
export {setXVIZConfig, getXVIZConfig} from './config/xviz-config';

// Synchronizers
export {default as LogSynchronizer} from './synchronizers/log-synchronizer';
export {default as StreamSynchronizer} from './synchronizers/stream-synchronizer';
export {default as XVIZStreamBuffer} from './synchronizers/xviz-stream-buffer';

// Styles
export {default as Stylesheet} from './styles/stylesheet';
export {default as XVIZStyleParser} from './styles/xviz-style-parser';

// Objects
export {default as BaseObject} from './objects/base-object';
export {default as SDV} from './objects/sdv';
export {default as XVIZObject} from './objects/xviz-object';
export {default as XVIZObjectCollection} from './objects/xviz-object-collection';

// Parsers
export {parseLogMetadata} from './parsers/parse-log-metadata';
export {parseVehiclePose} from './parsers/parse-vehicle-pose';
export {parseEtlStream} from './parsers/parse-etl-stream';
export {parseXVIZMessage, initializeWorkers} from './parsers/parse-xviz-message';
export {parseXVIZMessageSync, parseXVIZData} from './parsers/parse-xviz-message-sync';
export {default as lidarPointCloudWorker} from './workers/lidar-point-cloud-worker';
export {default as streamDataWorker} from './workers/stream-data-worker';

// Deprecated
export {parseXVIZMessage as parseStreamMessage} from './parsers/parse-xviz-message';
export {
  parseXVIZMessageSync as parseStreamDataMessage,
  parseXVIZData as parseStreamLogData
} from './parsers/parse-xviz-message-sync';
export {parseVideoMessageV1 as parseStreamVideoMessage} from './parsers/parse-video-message-v1';
export {XVIZ_MESSAGE_TYPE as LOG_STREAM_MESSAGE} from './constants';
export {XVIZ_GLTF_EXTENSION} from './constants';

export {
  isXVIZMessage,
  getXVIZMessageType,
  getDataFormat,
  isEnvelope,
  unpackEnvelope,
  parseBinaryXVIZ,
  isBinaryXVIZ
} from '@xviz/io';
