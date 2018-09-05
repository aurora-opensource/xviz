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

// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase */

const CATEGORY = {
  time_series: 'time_series',
  primitive: 'primitive',
  variable: 'variable'
};

const PRIMITIVE_TYPES = {
  point: 'point',
  polygon: 'polygon',
  polyline: 'polyline',
  circle: 'circle',
  stadium: 'stadium',
  text: 'text',
  image: 'image'
};

const requiredProps = ['streamId', '_category', '_type'];

/* global console */
/* eslint-disable no-console */
const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;
/* eslint-enable no-console */

// TODO: support all the v2 types
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

    // current streamId
    this.streamId = null;

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

  pose(pose) {
    this._validatePropSetOnce('_pose');
    this._validatePropSetOnce('_category');

    this._category = 'vehicle-pose';
    this._pose = pose;
    return this;
  }

  stream(streamId) {
    if (this.streamId) {
      this._flush();
    }

    this._reset();
    this.streamId = streamId;
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

  image(data, format) {
    this._validateStreamId();
    this._validatePropSetOnce('_image');
    this._validatePropSetOnce('_category');

    this._category = CATEGORY.primitive;
    this._type = PRIMITIVE_TYPES.image;

    this._image = {
      data,
      format
    };

    return this;
  }

  dimensions(widthPixel = null, heightPixel = null, depth = null) {
    if (!this._image) {
      this._validateError('An image needs to be set first.');
    }

    this._image.width_px = widthPixel;
    this._image.height_px = heightPixel;
    this._image.depth = depth;

    return this;
  }

  polygon(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.polygon;
    this._category = CATEGORY.primitive;
    return this;
  }

  polyline(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.polyline;
    this._category = CATEGORY.primitive;
    return this;
  }

  points(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.point;
    this._category = CATEGORY.primitive;
    return this;
  }

  circle(position, radius) {
    this._validateStreamId();
    this._validatePropSetOnce('_radius');
    this._validatePropSetOnce('_category');

    this.position(position);

    this._radius = radius;
    this._type = PRIMITIVE_TYPES.circle;
    this._category = CATEGORY.primitive;
    return this;
  }

  stadium(start, end, radius) {
    this._validateStreamId();
    this._validatePropSetOnce('_radius');
    this._validatePropSetOnce('_category');

    if (start.length !== 3) {
      this._validateError(
        `The start position must be of the form [x, y, z] where ${start} was provided`
      );
    }

    if (end.length !== 3) {
      this._validateError(
        `The end position must be of the form [x, y, z] where ${end} was provided`
      );
    }

    this._vertices = [start, end];
    this._radius = radius;
    this._type = PRIMITIVE_TYPES.stadium;
    this._category = CATEGORY.primitive;
    return this;
  }

  position(point) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');

    if (point.length !== 3) {
      this._validateError(`A position must be of the form [x, y, z] where ${point} was provided`);
    }

    this._vertices = [point];
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

    this._validateWarn(msg || `Stream ${this.streamId} ${prop} has been already set.`);
  }

  _validateStreamId() {
    if (!this.streamId) {
      this._validateError('A stream must be set first.');
    }
  }

  // eslint-disable-next-line complexity
  _validate() {
    // validate before calling flush

    // validate required fields
    for (const prop of requiredProps) {
      if (!this[prop]) {
        this._validateError(`Stream ${this.streamId} ${prop} is required.`);
      }
    }

    // validate primitive
    if (this._category === CATEGORY.primitive) {
      if (this._type === PRIMITIVE_TYPES.image && (!this._image || !this._image.data)) {
        this._validateWarn(`Stream ${this.streamId} image data are not provided.`);
      }
      if (this._type !== PRIMITIVE_TYPES.image && !this._vertices) {
        this._validateWarn(`Stream ${this.streamId} primitives vertices are not provided.`);
      }
    }

    // validate variable
    if (this._category === CATEGORY.variable && this._values.length === 0) {
      this._validateWarn(`Stream${this.streamId} variable value(s) are not provided.`);
    }

    // validate based on metadata
    if (this.metadata && this.metadata.streams) {
      const streamMetadata = this.metadata.streams[this.streamId];
      if (!streamMetadata) {
        this._validateWarn(`${this.streamId} is not defined in metadata.`);
      } else if (this._category !== streamMetadata.category) {
        this._validateWarn(
          `Stream ${this.streamId} category '${
            this._category
          }' does not match metadata definition (${streamMetadata.category}).`
        );
      }
    }
  }

  // eslint-disable-next-line complexity
  _flush() {
    this._validate();

    if (this.streamId && !this.disableStreams.includes(this.streamId)) {
      if (this._category === CATEGORY.variable) {
        if (!this._data.variables) {
          this._data.variables = {};
        }

        const obj = {
          timestamps: [this._ts],
          values: this._values,
          type: this._type
        };

        this._data.variables[this.streamId] = obj;
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

        if (this._data.primitives[this.streamId]) {
          this._data.primitives[this.streamId].push(obj);
        } else {
          this._data.primitives[this.streamId] = [obj];
        }
      }
    }

    this._reset();
  }

  _reset() {
    this.streamId = null;
    this._vertices = null;
    this._values = [];
    this._image = null;
    this._ts = null;
    this._category = null;
    this._type = null;
    this._id = null;
    this._color = null;
    this._classes = null;
    this._text = null;
    this._radius = null;
  }
}
