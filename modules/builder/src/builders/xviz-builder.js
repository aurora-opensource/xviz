import assert from 'assert';

const CATEGORY = {
  time_series: 'time_series',
  primitive: 'primitive',
  variable: 'variable',
  'vehicle-pose': 'vehicle-pose'
};

// _ts should be required or optional?
const requiredProps = ['stream_id', '_category', '_type'];

const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;

// TODO: Builder could validate against stream metadata!
// TODO: need validate with metadata defined stream category
export default class XVIZBuilder {
  constructor(metadata, disableStreams, {validateWarn, validateError}) {
    assert(metadata && metadata.streams);
    this.disableStreams = disableStreams;

    this.metadata = metadata;
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

    this._validateWarn = validateWarn || defaultValidateWarn;
    this._validateError = validateError || defaultValidateError;
  }

  pose(stream_id, pose) {
    if (this._pose) {
      this._validateWarn('Pose has been already set.');
    }
    this._category = CATEGORY['vehicle-pose'];
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

    this._vertices = vertices;
    this._type = 'polygon2d';
    this._category = CATEGORY.primitive;
    return this;
  }

  polyline(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');

    this._vertices = vertices;
    this._type = 'line2d';
    this._category = CATEGORY.primitive;
    return this;
  }

  points(vertices) {
    this._validateStreamId();
    this._validatePropSetOnce('_vertices');

    this._vertices = vertices;
    this._type = 'points3d';
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

    this._validateWarn(msg || `${prop} has been already set.`);
  }

  _validateStreamId() {
    if (this.stream_id) {
      this._validateWarn('Call stream first');
    }
  }

  _validate() {
    // validate before calling flush

    // validate required fields
    for (const prop of requiredProps) {
      if (this[prop]) {
        this._validateError(`${prop} is required.`);
      }
    }

    // validate primitive
    if (this._category === CATEGORY.primitive && !this._vertices) {
      this._validateWarn('Primitives vertices are not provided.');
    }

    // validate variable
    if (this._category === CATEGORY.variable && this._values.length === 0) {
      this._validateWarn('Variable value(s) are not provided.');
    }

    // validate based on metadata
    const streamMetadata = this.metadata.streams[this.stream_id];
    if (!streamMetadata) {
      this._validateWarn(`${this.stream_id} is defined in metadata.`);
    } else if (this._category !== streamMetadata.category) {
      this._validateWarn(
        `Category ${this._category} does not match metadata definition (${streamMetadata.category}).`
      );
    }

  }

  _flush() {
    this._validate();

    if (this.stream_id && !this.disableStreams.includes(this.stream_id)) {
      if (this._category === CATEGORY.variable) {
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

      if (this._category === CATEGORY.primitive) {
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
