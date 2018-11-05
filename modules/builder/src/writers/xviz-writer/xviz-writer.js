import {writeBinaryXVIZtoFile} from './xviz-binary-writer';
import {xvizConvertJson} from './xviz-json-encoder.js';

export default class XVIZWriter {
  constructor() {
    this.frameTimings = {
      frames: new Map()
    };
  }

  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizDirectory, xvizMetadata, options = {writeBinary: true, writeJson: false}) {
    const fs = module.require('fs');
    const path = module.require('path');
    const xvizMetadataFilename = path.join(xvizDirectory, '1-frame');

    this._saveTimestamp(xvizMetadata);

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
    this._saveTimestamp(xvizFrame, frameNumber);

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

  writeFrameIndex(xvizDirectory) {
    const fs = module.require('fs');
    const path = module.require('path');
    const frameFilePath = path.join(xvizDirectory, '0-frame');

    const {startTime, endTime, frames} = this.frameTimings;
    const frameTimings = {startTime, endTime};

    // Sort frames by index before writing out as an array
    const frameTimes = Array.from(frames.keys()).sort((a, b) => a - b);

    const timing = [];
    frameTimes.forEach((value, index) => {
      // Value is two greater than frame index
      const limit = timing.length;
      if (value > limit) {
        // Adding 2 because 1-frame is metadata file, so frame data starts at 2
        throw new Error(
          `Error writing time index file. Frames are missing between ${limit + 2} and ${value + 2}`
        );
      }

      timing.push(frames.get(value));
    });
    frameTimings.timing = timing;

    fs.writeFileSync(`${frameFilePath}.json`, JSON.stringify(frameTimings, {flag: 'w'}));
  }

  /* eslint-disable camelcase */
  _saveTimestamp(xviz_data, index) {
    const {log_info, updates} = xviz_data;

    if (log_info) {
      const {start_time, end_time} = log_info || {};
      this.frameTimings.startTime = start_time;
      this.frameTimings.endTime = end_time;
    } else if (updates && index !== undefined) {
      const min = Math.min(updates.map(update => update.timestamp));
      const max = Math.min(updates.map(update => update.timestamp));

      this.frameTimings.frames.set(index, [min, max]);
    } else {
      throw new Error('Cannot find timestamp');
    }
  }
  /* eslint-enable camelcase */
}
