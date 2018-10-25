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
    options = {writeBinary: true, writeJson: false}
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
          return Number(value.toFixed(10));
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
