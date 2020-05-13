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
/* eslint-disable max-depth */

import {setXVIZConfig} from '../config/xviz-config';
import {parseXVIZMessageSync} from '../parsers/parse-xviz-message-sync';
import {preSerialize} from '../parsers/serialize';
import {getTransferList} from '../utils/worker-utils';
import {XVIZ_MESSAGE_TYPE} from '../constants';

export default config => self => {
  setXVIZConfig(config);

  function onResult(message) {
    const transfers = new Set();

    switch (message.type) {
      case XVIZ_MESSAGE_TYPE.TIMESLICE:
        for (const streamName in message.streams) {
          const stream = message.streams[streamName];
          if (stream) {
            getTransferList(stream.pointCloud, true, transfers);
            getTransferList(stream.vertices, false, transfers);
            if (stream.images && stream.images.length) {
              stream.images.forEach(image => getTransferList(image, true, transfers));
            }
          }
        }
        break;

      case XVIZ_MESSAGE_TYPE.VIDEO_FRAME:
        // v1 video stream
        getTransferList(message.imageData, false, transfers);
        break;

      default:
    }

    message = preSerialize(message);

    /* uncomment for debug */
    // let size = 0;
    // for (const item of transfers) {
    //   size += item.byteLength;
    // }
    // message._size = {
    //   arraybuffer: size
    // };
    // message._sentAt = Date.now();

    self.postMessage(message, Array.from(transfers));
  }

  function onError(error) {
    throw error;
  }

  self.onmessage = e => {
    if (e.data && e.data.xvizConfig) {
      setXVIZConfig(e.data.xvizConfig);
    } else if (e.data) {
      parseXVIZMessageSync(e.data, onResult, onError);
    }
  };
};
