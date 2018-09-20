// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase */
import {insertTimestamp} from '../utils/sort';

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

const VARIABLE_TYPES = {
  float: 'float',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean'
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

  timestamp(timestamp) {
    if (timestamp instanceof Array) {
      this._validateError('Input should be a single value');
    }
    this._validateStreamId();
    this._validatePropSetOnce('_timestamps');

    this._timestamps = [timestamp];

    if (this._isFuture()) {
      this._flushFutures();
    }

    return this;
  }

  value(value) {
    if (value instanceof Array) {
      this._validateError('Input should be single value');
    }
    this._validateStreamId();
    this._validatePropSetOnce('_values');
    this._validatePropSetOnce('_category');

    this._values.push(value);
    this._category = CATEGORY.time_series;
    this._type = this._getValueType(value);

    return this;
  }

  timestamps(timestamps) {
    if (!(timestamps instanceof Array)) {
      this._validateError('timestamps should be array');
    }
    this._validateStreamId();
    this._validatePropSetOnce('_timestamps');

    this._timestamps = timestamps;

    return this;
  }

  values(values) {
    if (!(values instanceof Array)) {
      this._validateError('values should be array');
    }
    this._validateStreamId();
    this._validatePropSetOnce('_values');
    this._validatePropSetOnce('_category');

    this._values = values;
    this._category = CATEGORY.variable;
    this._type = this._getValuesType(values);

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

    if (this._isFuture()) {
      this._flushFutures();
    }

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

    if (this._isFuture()) {
      this._flushFutures();
    }

    return this;
  }

  polyline(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.polyline;
    this._category = CATEGORY.primitive;

    if (this._isFuture()) {
      this._flushFutures();
    }

    return this;
  }

  points(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');
    this._validatePropSetOnce('_category');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.point;
    this._category = CATEGORY.primitive;

    if (this._isFuture()) {
      this._flushFutures();
    }

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

    if (this._isFuture()) {
      this._flushFutures();
    }

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

    if (this._isFuture()) {
      this._flushFutures();
    }

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

  color(color) {
    this._validateStreamId();
    this._validatePropSetOnce('_color');

    this._color = color;
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

  _getValuesType(values) {
    let types = values.map(v => this._getValueType(v));
    types = Array.from(new Set(types)).sort();

    if (types.length === 1) {
      return types[0];
    } else if (
      // javascript treat 2.0 as 2 (Integer), 1.1 as float
      // so if list of value has both `float` and `integer`, consider as `float`
      types.length === 2 &&
      types.join(',') === [VARIABLE_TYPES.float, VARIABLE_TYPES.integer].join(',')
    ) {
      return VARIABLE_TYPES.float;
    }

    this._validateError(
      `Values type ${types.join(',')} are not consistent for stream ${this.streamId}`
    );
    return null;
  }

  _getValueType(value) {
    const type = typeof value;
    if (type === 'string') {
      return VARIABLE_TYPES.string;
    } else if (type === 'boolean') {
      return VARIABLE_TYPES.boolean;
    } else if (type === 'number') {
      if (Number.isInteger(value)) {
        return VARIABLE_TYPES.integer;
      }
      return VARIABLE_TYPES.float;
    }

    this._validateError(`Unsupported type ${type} for stream ${this.streamId}`);
    return null;
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

    // validate variable and time_series
    if (this._category === CATEGORY.variable || this._category === CATEGORY.time_series) {
      if (this._values.length === 0) {
        this._validateWarn(`Stream${this.streamId} value(s) are not provided.`);
      }
      if (this._timestamps.length === 0) {
        this._validateWarn(`Stream${this.streamId} timestamp are not provided.`);
      }
      if (this._values.length !== this._timestamps.length) {
        this._validateWarn(
          `Stream${this.streamId} length of values and length of timestamps are not equal.`
        );
      }
      if (!this._type) {
        this._validateWarn(`Stream${this.streamId} type is not provided.`);
      }
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

  _formatVariable() {
    return {
      timestamps: this._timestamps,
      values: this._values,
      type: this._type
    };
  }

  _formatPrimitives() {
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

    return obj;
  }

  _isFuture() {
    return this._category === CATEGORY.primitive && this._timestamps;
  }

  _flushFutures() {
    if (!this._data.futures) {
      this._data.futures = {};
    }
    if (!this._data.futures[this.streamId]) {
      this._data.futures[this.streamId] = {
        name: this.streamId,
        timestamps: [],
        primitives: []
      };
    }

    const future = this._data.futures[this.streamId];
    const primitive = this._formatPrimitives();

    const {timestamps, primitives} = future;

    // insert ts and primitive to the position based on timestamp order
    insertTimestamp(timestamps, primitives, this._timestamps[0], [primitive]);

    this._resetPrimitives();
  }

  // eslint-disable-next-line complexity
  _flush() {
    this._validate();

    if (this.streamId && !this.disableStreams.includes(this.streamId)) {
      if (this._category === CATEGORY.variable || this._category === CATEGORY.time_series) {
        if (!this._data.variables) {
          this._data.variables = {};
        }
        this._data.variables[this.streamId] = this._formatVariable();
      }

      if (this._category === CATEGORY.primitive) {
        if (!this._data.primitives) {
          this._data.primitives = {};
        }
        if (!this._data.primitives[this.streamId]) {
          this._data.primitives[this.streamId] = [];
        }

        const primitiveObj = this._formatPrimitives();
        this._data.primitives[this.streamId].push(primitiveObj);
      }
    }

    this._reset();
  }

  _resetPrimitives() {
    this._timestamps = null;
    this._category = null;

    this._image = null;
    this._type = null;
    this._radius = null;
    this._text = null;
    this._vertices = null;

    this._id = null;
    this._color = null;
    this._classes = null;
  }

  _resetVariables() {
    this._timestamps = null;
    this._category = null;

    this._values = [];
  }

  _reset() {
    this.streamId = null;

    this._resetPrimitives();
    this._resetVariables();
  }
}
