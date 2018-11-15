import {setXVIZConfig, setXVIZSettings} from '../config/xviz-config';
import {parseStreamDataMessage} from '../parsers/parse-stream-data-message';
import {preSerialize} from '../parsers/serialize';
import {getTransferList} from '../utils/worker-utils';
import {LOG_STREAM_MESSAGE} from '../constants';

export default config => self => {
  setXVIZConfig(config);

  function onResult(message) {
    const transfers = new Set();

    switch (message.type) {
      case LOG_STREAM_MESSAGE.TIMESLICE:
        for (const streamName in message.streams) {
          const stream = message.streams[streamName];
          getTransferList(stream.pointCloud, true, transfers);
          if (stream.images && stream.images.length) {
            stream.images.forEach(image => getTransferList(image, true, transfers));
          }
        }
        break;

      case LOG_STREAM_MESSAGE.VIDEO_FRAME:
        // v1 video stream
        getTransferList(message.imageData, false, transfers);
        break;

      default:
    }

    message = preSerialize(message);

    /* uncomment for debug */
    // message._size = {
    //   arraybuffer: transfers.size
    // };
    // message._sentAt = Date.now();

    self.postMessage(message, Array.from(transfers));
  }

  function onError(error) {
    throw error;
  }

  self.onmessage = e => {
    if (e.data.xvizConfig || e.data.xvizSettings) {
      setXVIZConfig(e.data.xvizConfig);
      setXVIZSettings(e.data.xvizSettings);
    } else {
      parseStreamDataMessage(e.data, onResult, onError);
    }
  };
};
