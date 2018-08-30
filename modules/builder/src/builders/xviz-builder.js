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

const CATEGORY = {
  time_series: 'time_series',
  primitive: 'primitive',
  variable: 'variable'
};

// _ts should be required or optional?
const requiredProps = ['stream_id', '_category', '_type'];

const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;

// TODO: Builder could validate against stream metadata!
export default class XVIZBuilder {
  constructor({
    metadata = {},
    disableStreams = [],
    validateWarn = defaultValidateWarn,
    validateError = defaultValidateError
  } = {}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

    this.metadata = metadata;
    this.disableStreams = disableStreams;

    this._pose = null;
    this.pose_stream_id = null;

    // current stream_id
    this.stream_id = null;

    // There are many fields we use to track temporary state.
    this._reset();

    // Storage of objects after fully constructed
    // Will contain
    //  {
    //    variables: {}
    //    primitives: {}
    //    futures: {}
    //  }
    this._data = {};
  }

  pose(stream_id, pose) {
    this._validatePropSetOnce('_pose');
    this._validatePropSetOnce('_category');

    this._category = 'vehicle-pose';
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
    this._validateStreamId();
    this._validatePropSetOnce('_ts');

    this._ts = ts;
    return this;
  }

  value(value) {
    this._validateStreamId();
    this._validatePropSetOnce('_values');
    this._validatePropSetOnce('_category');

    this._values.push(value);
    this._category = CATEGORY.variable;

    // TODO: hack
    this._type = 'float';

    // int, float, string, boolean
    return this;
  }

  polygon(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = 'polygon';
    this._category = CATEGORY.primitive;
    return this;
  }

  polyline(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = 'polyline';
    this._category = CATEGORY.primitive;
    return this;
  }

  points(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = 'point';
    this._category = CATEGORY.primitive;
    return this;
  }

  color(clr) {
    this._validateStreamId();
    this._validatePropSetOnce('_color');

    this._color = clr;
    return this;
  }

  id(identifier) {
    this._validateStreamId();
    this._validatePropSetOnce('_id');

    this._id = identifier;
    return this;
  }

  text(message) {
    this._validateStreamId();
    this._validatePropSetOnce('_text');
    this._validatePropSetOnce('_category');

    this._text = message;
    this._type = 'text';
    this._category = CATEGORY.primitive;
    return this;
  }

  circle(position, radius) {
    this._validateStreamId();
    this._validatePropSetOnce('_radius');
    this._validatePropSetOnce('_category');

    this.position(position);

    this._radius = radius;
    this._type = 'circle';
    this._category = CATEGORY.primitive;
    return this;
  }

  stadium(start, end, radius) {
    this._validateStreamId();
    this._validatePropSetOnce('_radius');
    this._validatePropSetOnce('_category');

    if (start.length != 3) {
      this._validateError(
        `The start position must be of the form [x, y, z] where ${point} was provided`
      );
    }

    if (end.length != 3) {
      this._validateError(
        `The end position must be of the form [x, y, z] where ${point} was provided`
      );
    }

    this._vertices = [start, end];
    this._radius = radius;
    this._type = 'stadium';
    this._category = CATEGORY.primitive;
    return this;
  }

  position(point) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');

    if (point.length != 3) {
      this._validateError(`A position must be of the form [x, y, z] where ${point} was provided`);
    }

    this._vertices = [point];
    return this;
  }

  classes(classList) {
    this._validateStreamId();
    this._validatePropSetOnce('_classes');

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

  _validatePropSetOnce(prop, msg) {
    if (!this[prop]) {
      return;
    }
    if (this[prop] instanceof Array && this[prop].length === 0) {
      return;
    }

    this._validateWarn(msg || `Stream ${this.stream_id} ${prop} has been already set.`);
  }

  _validateStreamId() {
    if (!this.stream_id) {
      this._validateError('A stream must be set first.');
    }
  }

  _validate() {
    // validate before calling flush

    // validate required fields
    for (const prop of requiredProps) {
      if (!this[prop]) {
        this._validateError(`Stream ${this.stream_id} ${prop} is required.`);
      }
    }

    // validate primitive
    if (this._category === CATEGORY.primitive && !this._vertices) {
      this._validateWarn(`Stream ${this.stream_id} primitives vertices are not provided.`);
    }

    // validate variable
    if (this._category === CATEGORY.variable && this._values.length === 0) {
      this._validateWarn(`Stream${this.stream_id} variable value(s) are not provided.`);
    }

    // validate based on metadata
    if (this.metadata && this.metadata.streams) {
      const streamMetadata = this.metadata.streams[this.stream_id];
      if (!streamMetadata) {
        this._validateWarn(`${this.stream_id} is not defined in metadata.`);
      } else if (this._category !== streamMetadata.category) {
        this._validateWarn(
          `Stream ${this.stream_id} category '${
            this._category
          }' does not match metadata definition (${streamMetadata.category}).`
        );
      }
    }
  }

  _flush() {
    this._validate();

    if (this.stream_id && !this.disableStreams.includes(this.stream_id)) {
      if (this._category === CATEGORY.variable) {
        if (!this._data.variables) {
          this._data.variables = {};
        }

        const obj = {
          timestamps: [this._ts],
          values: this._values,
          type: this._type
        };

        this._data.variables[this.stream_id] = obj;
      }

      if (this._category === CATEGORY.primitive) {
        if (!this._data.primitives) {
          this._data.primitives = {};
        }

        const obj = {
          type: this._type
        };

        switch (this._type) {
          case 'polygon':
          case 'polyline':
          case 'point':
            obj.vertices = this._vertices;
            break;
          case 'text':
            obj.position = this._vertices[0];
            obj.text = this._text;
            break;
          case 'circle':
            obj.center = this._vertices[0];
            obj.radius_m = this._radius;
            break;
          case 'stadium':
            obj.start = this._vertices[0];
            obj.end = this._vertices[1];
            obj.radius_m = this._radius;
            break;
          case 'image':
            Object.assign(obj, this._image);
            break;
          default:
        }

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
    this._text = null;
    this._radius = null;
  }
}
