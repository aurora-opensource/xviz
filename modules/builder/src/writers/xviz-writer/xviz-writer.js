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

import {writeBinaryXVIZtoFile} from './xviz-binary-writer';
import {xvizConvertJson} from './xviz-json-encoder.js';

export default class XVIZWriter {
  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizDirectory, xvizMetadata, options = {writeBinary: true, writeJson: false}) {
    const fs = module.require('fs');
    const path = module.require('path');
    const xvizMetadataFilename = path.join(xvizDirectory, '1-frame');
    if (options.writeBinary) {
      writeBinaryXVIZtoFile(xvizMetadataFilename, xvizMetadata, {flattenArrays: false});
    }

    if (options.writeJson) {
      fs.writeFileSync(`${xvizMetadataFilename}.json`, JSON.stringify(xvizMetadata, null, 2), {
        flag: 'w'
      });
    }
  }

  writeFrame(
    xvizDirectory,
    frameNumber,
    xvizFrame,
    options = {writeBinary: true, writeJson: false, precision: 9}
  ) {
    const fs = module.require('fs');
    const path = module.require('path');
    // +2 is because 1 is metadata, so we start with 2
    const frameFilePath = path.join(xvizDirectory, `${frameNumber + 2}-frame`);
    if (options.writeBinary) {
      writeBinaryXVIZtoFile(frameFilePath, xvizFrame, {flattenArrays: false});
    }

    if (options.writeJson) {
      // Limit precision to save space
      const numberRounder = (k, value) => {
        if (typeof value === 'number') {
          return Number(value.toFixed(options.precision));
        }

        return value;
      };

      const jsonXvizFrame = xvizConvertJson(xvizFrame);
      fs.writeFileSync(`${frameFilePath}.json`, JSON.stringify(jsonXvizFrame, numberRounder), {
        flag: 'w'
      });
    }
  }
}
