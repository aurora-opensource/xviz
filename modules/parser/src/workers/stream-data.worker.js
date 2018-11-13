/* global self */
import {setXVIZConfig, setXVIZSettings} from '../config/xviz-config';
import {parseStreamDataMessage} from '../parsers/parse-stream-data-message';
import {preSerialize} from '../parsers/serialize';
function onResult(message) {
  const transfers = [];
  const {channels} = message;
  if (channels) {
    for (const streamName in channels) {
      const {pointCloud} = channels[streamName];
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
  if (e.data.xvizConfig) {
    setXVIZConfig(e.data.xvizConfig);
    setXVIZSettings(e.data.xvizSettings);
  } else {
    parseStreamDataMessage(e.data, onResult, onError);
  }
};
