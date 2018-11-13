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
import {parseXVIZStream} from '../parsers/parse-xviz-stream';
import {TextDecoder} from '../utils/text-encoding';

export default config => self => {
  setXVIZConfig(config);

  self.onmessage = e => {
    const dataView = new DataView(e.data);
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(dataView);

    try {
      let data = JSON.parse(decodedString);
      data = parseXVIZStream(data);

      const transfers = [];

      data = data.map(({pointCloud, time}) => {
        if (pointCloud) {
          transfers.push(
            pointCloud.ids.buffer,
            pointCloud.colors.buffer,
            pointCloud.positions.buffer
          );
        }
        return {pointCloud, time};
      });

      // https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
      self.postMessage(
        // aMessage
        data,
        // transferList, calls out which elements inside the data structure of the
        // first argument to not copy
        transfers
      );

      // Terminate
      self.close();
    } catch (error) {
      throw new Error(error);
    }
  };
};
