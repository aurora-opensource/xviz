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

// export const XVIZ_STREAM_CATEGORY = [
//   'time_series',
//   'primitive',
//   'variable',
//   'time_series',
//   'vehicle-pose'
// ];
//
// export const XVIZ_PRIMITIVE_TYPE = ['polygon', 'polyline', 'points'];

// TODO: Builder could validate against stream metadata!
export default class XVIZBuilder {
  constructor(disableStreams) {
    this.disableStreams = disableStreams;

    this._pose = null;
    this.pose_stream_id = null;

    // current stream_id
    this.stream_id = null;

    // There are many fields we use to track temporary state.
    this._reset();

    // Storage of objects after fully constructed
    this._data = {
      variables: {},
      primitives: {}
    };
  }

  pose(stream_id, pose) {
    this.pose_stream_id = stream_id;
    this._pose = pose;
    return this;
  }

  stream(stream_id) {
    if (this.stream_id) {
      this._flush();
    }

    this._reset();
    this.stream_id = stream_id;
    return this;
  }

  // single is ts, multiple is variable
  timestamp(ts) {
    this._ts = ts;
    return this;
  }

  value(value) {
    this._values.push(value);
    this._category = 'var';

    // TODO: hack
    this._type = 'float';

    // int, float, string, boolean
    return this;
  }

  polygon(vertices) {
    this._vertices = vertices;
    this._type = 'polygon2d';
    this._category = 'prim';
    return this;
  }

  polyline(vertices) {
    this._vertices = vertices;
    this._type = 'line2d';
    this._category = 'prim';
    return this;
  }

  points(vertices) {
    this._vertices = vertices;
    this._type = 'points3d';
    this._category = 'prim';
    return this;
  }

  color(clr) {
    this._color = clr;
    return this;
  }

  id(identifier) {
    this._id = identifier;
    return this;
  }

  classes(classList) {
    this._classes = classList;
    return this;
  }

  getFrame() {
    this._flush();

    const frame = {
      vehicle_pose: this._pose,
      state_updates: [
        {
          timestamp: this._pose.time,
          ...this._data
        }
      ]
    };

    return frame;
  }

  _flush() {
    if (this.stream_id && !this.disableStreams.includes(this.stream_id)) {
      if (this._category === 'var') {
        const obj = {
          timestamps: [this._ts],
          values: this._values,
          type: this._type
        };

        if (this._data.variables[this.stream_id]) {
          this._data.variables[this.stream_id].push(obj);
        } else {
          this._data.variables[this.stream_id] = [obj];
        }
      }

      if (this._category === 'prim') {
        const obj = {
          type: this._type,
          vertices: this._vertices
        };

        if (this._id) {
          obj.id = this._id;
        }

        if (this._color) {
          obj.color = this._color;
        }

        if (this._classes) {
          obj.classes = this._classes;
        }

        if (this._data.primitives[this.stream_id]) {
          this._data.primitives[this.stream_id].push(obj);
        } else {
          this._data.primitives[this.stream_id] = [obj];
        }
      }
    }

    this._reset();
  }

  _reset() {
    this.stream_id = null;
    this._values = [];
    this._ts = null;
    this._category = null;
    this._type = null;
    this._id = null;
    this._vertices = null;
    this._color = null;
    this._classes = null;
  }
}
