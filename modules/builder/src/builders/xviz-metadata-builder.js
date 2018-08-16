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

export default class XVIZMetadataBuilder {
  constructor() {
    this.data = {
      streams: {},
      styles: {}
    };

    this.stream_id = null;
    this.tmp_stream = {};
  }

  startTime(time) {
    this.data.start_time = time;
    return this;
  }

  endTime(time) {
    this.data.end_time = time;
    return this;
  }

  stream(stream_id) {
    if (this.stream_id) {
      this._flush();
    }

    this.stream_id = stream_id;
    return this;
  }

  category(cat) {
    this.tmp_stream.category = cat;
    return this;
  }

  type(t) {
    this.tmp_stream.type = t;
    return this;
  }

  unit(u) {
    this.tmp_stream.unit = u;
    return this;
  }

  coordinate(t) {
    this.tmp_stream.coordinate = t;
    return this;
  }

  styleClassDefault(style) {
    this.styleClass('*', style);
    return this;
  }

  styleClass(className, style) {
    if (!this.data.styles[this.stream_id]) {
      this.data.styles[this.stream_id] = {
        [className]: style
      };
    } else {
      this.data.styles[this.stream_id][className] = style;
    }
    return this;
  }

  getMetadata() {
    this._flush();

    return {
      type: 'metadata',
      ...this.data
    };
  }

  _flush() {
    if (this.stream_id) {
      this.data.streams[this.stream_id] = this.tmp_stream;
    }

    this._reset();
  }

  _reset() {
    this.stream_id = null;
    this.tmp_stream = {};
  }
}
