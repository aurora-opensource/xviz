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
import Converter from './converter';
import {TimeUtil} from 'rosbag';

// Currently every message *MUST* have a pose. However, if we don't have one
// we can create a fake pose at (0, 0, 0) which time is set by the topic message
// timestamp.
export class XVIZFakePose extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'XVIZFakePose';
  }

  // Should never match anything, but an empty string seems too fragile
  static get messageType() {
    return 'xviz_msgs/FakePose';
  }

  async convertMessage(frame, xvizBuilder) {
    const position = this.config.position || [0, 0, 0];

    const msg = frame[this.topic];
    if (!msg) {
      return;
    }

    const {timestamp} = msg[msg.length - 1];

    xvizBuilder
      .pose(this.xvizStream)
      .position(...position)
      .timestamp(TimeUtil.toDate(timestamp).getTime() / 1e3);
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder.stream(this.xvizStream).category('pose');
  }
}
