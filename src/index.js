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
export {LOG_STREAM_MESSAGE, STREAM_DATA_CONTENT} from './constants';

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
export {parseVehiclePose, parseVehiclePoseDatum} from './parsers/parse-vehicle-pose';
export {parseEtlStream} from './parsers/parse-etl-stream';
export {parseStreamMessage, initializeWorkers} from './parsers/parse-stream-message';
export {parseStreamDataMessage, parseStreamLogData} from './parsers/parse-stream-data-message';
export {parseStreamVideoMessage} from './parsers/parse-stream-video-message';
export {parseXvizV1} from './parsers/parse-xviz-v1';

export {default as lidarPointCloudWorker} from './workers/lidar-point-cloud-worker';
export {default as streamDataWorker} from './workers/stream-data-worker';

// LOADERS

export {loadUri} from './loaders/loader-utils/load-uri.js';

export {parseBinaryXVIZ} from './loaders/xviz-loader/xviz-binary-loader';
export {encodeBinaryXVIZ} from './loaders/xviz-loader/xviz-binary-writer';
export {default as XVIZWriter} from './loaders/xviz-loader/xviz-writer';
export {default as XVIZBuilder} from './loaders/xviz-loader/xviz-builder';
export {default as XVIZMetadataBuilder} from './loaders/xviz-loader/xviz-metadata-builder';

export {parseGLB} from './loaders/glb-loader/glb-loader';
export {encodeGLB} from './loaders/glb-loader/glb-writer';

export {default as PLYParser} from './loaders/ply-loader/ply-parser';
export {loadBinary, parsePLY, generateNormals, normalizeXYZ} from './loaders/ply-loader/ply-loader';

// Experimental exports, exposes internals
export {default as _GLBDecoder} from './loaders/glb-loader/glb-decoder';
export {default as _GLBEncoder} from './loaders/glb-loader/glb-encoder';
export {default as _GLBBufferPacker} from './loaders/glb-loader/glb-buffer-packer';
export {default as _unpackGLBBuffers} from './loaders/glb-loader/unpack-glb-buffers';
export {
  packJsonArrays as _packJsonArrays,
  unpackJsonArrays as _unpackJsonArrays
} from './loaders/glb-loader/pack-json-arrays';
