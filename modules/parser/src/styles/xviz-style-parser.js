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

import Stylesheet from './stylesheet';

const EMPTY_STYLESHEET = new Stylesheet();

/* Parser for multiple stylesheets */
export default class XVIZStyleParser {
  /**
   * @constructor
   * @param {Object} data - a map from stream name to stylesheet definition
   */
  constructor(data) {
    this.stylesheets = {};
    for (const streamName in data) {
      this.stylesheets[streamName] = new Stylesheet(data[streamName]);
    }
  }

  /**
   * get stylesheet by stream name.
   * @param {String} streamName - name of the stream/stream
   * @returns {Stylesheet}
   */
  getStylesheet(streamName) {
    return this.stylesheets[streamName] || EMPTY_STYLESHEET;
  }
}
