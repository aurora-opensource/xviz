import {writeBinaryXVIZtoFile} from './xviz-binary-writer';
import {xvizConvertJson} from './xviz-json-encoder.js';

const frameName = index => `${index + 2}-frame`;

/**
 * Class to abstract away file IO
 */
class FileSink {
  constructor() {
    this.fs = module.require('fs');
    this.path = module.require('path');
  }

  writeSync(scope, name, data) {
    const xvizMetadataFilename = this.path.join(scope, name);
    const options = {
      flag: 'w'
    };
    this.fs.writeFileSync(xvizMetadataFilename, data, options);
  }
}

export default class XVIZWriter {
  constructor(dataSink) {
    this.sink = dataSink || new FileSink();
    this.frameTimings = {
      frames: new Map()
    };
    this.wroteFrameIndex = null;
  }

  // xvizMetadata is the object returned
  // from a Builder.
  writeMetadata(xvizDirectory, xvizMetadata, options = {writeBinary: true, writeJson: false}) {
    this._saveTimestamp(xvizMetadata);

    if (options.writeBinary) {
      writeBinaryXVIZtoFile(this.sink, xvizDirectory, '1-frame', xvizMetadata, {
        flattenArrays: false
      });
    }

    if (options.writeJson) {
      this.sink.writeSync(xvizDirectory, '1-frame.json', JSON.stringify(xvizMetadata));
    }
  }

  writeFrame(
    xvizDirectory,
    frameNumber,
    xvizFrame,
    options = {writeBinary: true, writeJson: false}
  ) {
    if (this.wroteFrameIndex !== null) {
      throw new Error(
        `writeFrame() was called after writeFrameIndex().  The index was written with last frame of ${frameName(
          this.wroteFrameIndex - 1
        )}`
      );
    }

    this._saveTimestamp(xvizFrame, frameNumber);

    if (options.writeBinary) {
      writeBinaryXVIZtoFile(this.sink, xvizDirectory, frameName(frameNumber), xvizFrame, {
        flattenArrays: false
      });
    }

    if (options.writeJson) {
      // Limit precision to save space
      const numberRounder = (k, value) => {
        if (typeof value === 'number') {
          return Number(value.toFixed(10));
        }

        return value;
      };

      const jsonXVIZFrame = xvizConvertJson(xvizFrame);
      this.sink.writeSync(
        xvizDirectory,
        `${frameName(frameNumber)}.json`,
        JSON.stringify(jsonXVIZFrame, numberRounder)
      );
    }
  }

  writeFrameIndex(xvizDirectory) {
    const {startTime, endTime, frames} = this.frameTimings;
    const frameTimings = {};

    if (startTime) {
      frameTimings.startTime = startTime;
    }

    if (endTime) {
      frameTimings.endTime = endTime;
    }

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

    this.sink.writeSync(xvizDirectory, '0-frame.json', JSON.stringify(frameTimings));
    this.wroteFrameIndex = timing.length;
  }

  /* eslint-disable camelcase */
  _saveTimestamp(xviz_data, index) {
    const {log_info, updates} = xviz_data;

    if (index === undefined) {
      // Metadata case
      if (log_info) {
        const {start_time, end_time} = log_info || {};
        if (start_time) {
          this.frameTimings.startTime = start_time;
        }

        if (end_time) {
          this.frameTimings.endTime = end_time;
        }
      }
    } else if (updates) {
      if (updates.length === 0 || !updates.every(update => typeof update.timestamp === 'number')) {
        throw new Error('XVIZ updates did not contain a valid timestamp');
      }

      const min = Math.min(updates.map(update => update.timestamp));
      const max = Math.max(updates.map(update => update.timestamp));

      this.frameTimings.frames.set(index, [min, max, index, frameName(index)]);
    } else {
      // Missing updates & index is invalid call
      throw new Error('Cannot find timestamp');
    }
  }
  /* eslint-enable camelcase */
}
