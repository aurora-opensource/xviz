import {writeBinaryXVIZtoFile} from './xviz-binary-writer';


export default class XVIZWriter {
  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizDirectory, xvizMetadata) {
    const fs = module.require('fs');
    const path = module.require('path');
    const xvizMetadataFilename = path.join(xvizDirectory, '1-frame');
    writeBinaryXVIZtoFile(xvizMetadataFilename, xvizMetadata, {flattenArrays: false});
    fs.writeFileSync(`${xvizMetadataFilename}.json`, JSON.stringify(xvizMetadata, null, 2), {
      flag: 'w'
    });
  }

  writeFrame(xvizDirectory, frame_number, xvizFrame) {
    const path = module.require('path');
    // +2 is because 1 is metadata, so we start with 2
    const frameFilePath = path.join(xvizDirectory, `${frame_number + 2}-frame`);
    writeBinaryXVIZtoFile(frameFilePath, xvizFrame, {flattenArrays: false});
  }
}
