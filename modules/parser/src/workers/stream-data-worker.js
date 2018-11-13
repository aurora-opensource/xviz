import {setXVIZConfig} from '../config/xviz-config';
import {parseStreamDataMessage} from '../parsers/parse-stream-data-message';
import {preSerialize} from '../parsers/serialize';

export default config => self => {
  setXVIZConfig(config);

  function onResult(message) {
    const transfers = [];
    const {streams} = message;

    if (streams) {
      for (const streamName in streams) {
        const {pointCloud} = streams[streamName];
        if (pointCloud) {
          transfers.push(
            pointCloud.ids.buffer,
            pointCloud.colors.buffer,
            pointCloud.positions.buffer
          );
        }
      }
    }

    message = preSerialize(message);
    self.postMessage(message, transfers);
  }

  function onError(error) {
    throw error;
  }

  self.onmessage = e => {
    parseStreamDataMessage(e.data, onResult, onError);
  };
};
