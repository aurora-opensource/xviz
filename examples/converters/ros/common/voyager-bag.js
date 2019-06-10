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
/* eslint-disable camelcase */
import {XVIZROSBag} from '@xviz/ros';

export class VoyagerBag extends XVIZROSBag {
  constructor(bagPath, topicConfig) {
    super(bagPath, topicConfig);
  }

  async initBag(context, bag) {
    await super.initBag(context, bag);

    const CONFIGURATION = '/commander/configuration';

    let origin = {latitude: 0, longitude: 0, altitude: 0};
    await bag.readMessages({topics: [CONFIGURATION]}, ({topic, message}) => {
      const config = message.keyvalues.reduce((memo, kv) => {
        memo[kv.key] = kv.value;
        return memo;
      }, {});

      if (config.map_lat) {
        origin = {
          latitude: parseFloat(config.map_lat),
          longitude: parseFloat(config.map_lng),
          altitude: parseFloat(config.map_alt)
        };
      }
    });

    // This is used by the GPS Converter the origin
    // for the vehicle position
    context.origin = origin;
  }

  // could override and skip this entirely
  async initMetadata(context, ros2xviz) {
    const metadata = await super.initMetadata(context, ros2xviz);

    const FORWARD_CENTER = '/vehicle/camera/center_front'; // example
    const CENTER_FRONT = '/vehicle/camera/forward_center/image_raw/compressed'; // dc golf

    metadata.data.ui_config = {
      Camera: {
        type: 'panel',
        children: [
          {
            type: 'video',
            cameras: [FORWARD_CENTER, CENTER_FRONT]
          }
        ],
        name: 'Camera'
      }
    };

    return metadata;
  }
}
