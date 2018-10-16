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
export {LOG_STREAM_MESSAGE} from './constants';

// Configuration
export {setXvizConfig, getXvizConfig, setXvizSettings, getXvizSettings} from './config/xviz-config';

// Synchronizers
export {default as LogSynchronizer} from './synchronizers/log-synchronizer';
export {default as StreamSynchronizer} from './synchronizers/stream-synchronizer';
export {default as XvizStreamBuffer} from './synchronizers/xviz-stream-buffer';

// Styles
export {default as Stylesheet} from './styles/stylesheet';
export {default as XvizStyleParser} from './styles/xviz-style-parser';

// Objects
export {default as BaseObject} from './objects/base-object';
export {default as SDV} from './objects/sdv';
export {default as XvizObject} from './objects/xviz-object';
export {default as XvizObjectCollection} from './objects/xviz-object-collection';

// Parsers
export {parseLogMetadata} from './parsers/parse-log-metadata';
export {parseVehiclePose} from './parsers/parse-vehicle-pose';
export {parseEtlStream} from './parsers/parse-etl-stream';
export {parseStreamMessage, initializeWorkers} from './parsers/parse-stream-message';
export {parseStreamDataMessage, parseStreamLogData} from './parsers/parse-stream-data-message';
export {parseStreamVideoMessage} from './parsers/parse-stream-video-message';

export {default as lidarPointCloudWorker} from './workers/lidar-point-cloud-worker';
export {default as streamDataWorker} from './workers/stream-data-worker';

// LOADERS
// Public methods
export {parseBinaryXVIZ} from './loaders/xviz-loader/xviz-binary-loader';
export {parseGLB, _GLBDecoder, _unpackGLBBuffers, _unpackJsonArrays} from './loaders/glb-loader';

export {default as PLYParser} from './loaders/ply-loader/ply-parser';
export {loadBinary, parsePLY, generateNormals, normalizeXYZ} from './loaders/ply-loader/ply-loader';
