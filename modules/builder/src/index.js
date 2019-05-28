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

// UTILS
export {loadUri} from './utils/load-uri.js';
export {flattenToTypedArray} from './utils/flatten.js';
// This is used in @xviz/io and will eventually be moved there. Prefix with underscore
// to mark this as a private export
export {packBinaryJson as _packBinaryJson} from './writers/xviz-writer/xviz-pack-binary';

// WRITERS
export {default as XVIZWriter} from './writers/xviz-writer/xviz-writer';
export {encodeBinaryXVIZ} from './writers/xviz-writer/xviz-binary-writer';

// BUILDERS
export {default as XVIZBuilder} from './builders/xviz-builder';
export {default as XVIZMetadataBuilder} from './builders/xviz-metadata-builder';
export {default as XVIZUIBuilder} from './builders/declarative-ui/xviz-ui-builder';

export {
  getGeospatialToPoseTransform as _getGeospatialToPoseTransform,
  getPoseTrajectory as _getPoseTrajectory,
  getObjectTrajectory as _getObjectTrajectory,
  getRelativeCoordinates as _getRelativeCoordinates
} from './builders/helpers/xviz-trajectory-helper';
