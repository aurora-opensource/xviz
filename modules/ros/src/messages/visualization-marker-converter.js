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
import _ from 'lodash';
import {VisualizationMarkerArray} from './visualization-markerarray-converter';

/**
 * Handles converting Marker messages
 */
export class VisualizationMarker extends VisualizationMarkerArray {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'VisualizationMarker';
  }

  static get messageType() {
    return 'visualization_msgs/Marker';
  }

  async convertMessage(frame, xvizBuilder) {
    const messages = frame[this.topic];
    if (messages) {
      const markers = _.map(messages, 'message');
      markers.forEach(marker => this._processMarker(marker));
    }

    this.writeMarkers(xvizBuilder);
  }
}
