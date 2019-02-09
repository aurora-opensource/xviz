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

import {setXVIZConfig} from '../config/xviz-config';
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
    if (e.data.xvizConfig) {
      setXVIZConfig(e.data.xvizConfig);

      // Expected to return a message with a field 'type'
      onResult({type: 'update_xvizConfig'});
    } else {
      parseStreamDataMessage(e.data, onResult, onError);
    }
  };
};
