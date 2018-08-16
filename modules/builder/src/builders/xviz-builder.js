import assert from 'assert';

const streamIdValidator = builder => {
  if (!Boolean(builder.stream_id)) {
    throw new Error('Setup stream first');
  }
};

const streamsValidator = (builder, operation, {value}) => {
  const streams = builder.metadata.streams;
  if (!streams[value]) {
    throw new Error(`Stream ${value} is not defined in metadata.`);
  }
};

const dataValidator = builder => {
  // validate if data is already set
  if (Boolean(builder._vertices || builder._category)) {
    throw new Error('Stream already has data');
  }
};

const CAT_OP_MAP = {
  var: ['value'],
  prim: ['polygon', 'polyline', 'points', 'id', 'classes']
};

const categoryValidator = (builder, operation) => {
  // validate if this operation can be applied to this category
  if (!CAT_OP_MAP[builder._category].includes(operation)) {
    throw new Error(`${operation} can not be applied to ${builder._category}`);
  }
};

const OP_VALIDATOR_MAP = {
  stream: [streamsValidator],
  timestamp: [streamIdValidator],
  value: [streamIdValidator, dataValidator],
  polygon: [streamIdValidator, dataValidator],
  polyline: [streamIdValidator, dataValidator],
  points: [streamIdValidator, dataValidator],
  id: [streamIdValidator, dataValidator, categoryValidator],
  classes: [streamIdValidator, dataValidator, categoryValidator]
};

function getValidators(operation) {
  return OP_VALIDATOR_MAP[operation];
}

function validate(builder, operation, options) {
  const validators = getValidators(operation);
  for (let i = 0; i < validators.length; i++) {
    validators[i](builder, operation, options);
  }
  return true;
}

// TODO: Builder could validate against stream metadata!
// TODO: need validate with metadata defined stream category
export default class XVIZBuilder {
  constructor(metadata, disableStreams) {
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
  }

  pose(stream_id, pose) {
    this.pose_stream_id = stream_id;
    this._pose = pose;
    return this;
  }

  stream(stream_id) {
    validate(this, 'stream', {value: stream_id});

    if (this.stream_id) {
      this._flush();
    }

    this._reset();
    this.stream_id = stream_id;
    return this;
  }

  // single is ts, multiple is variable
  timestamp(ts) {
    validate(this, 'timestamp');

    this._ts = ts;
    return this;
  }

  value(value) {
    validate(this, 'value');

    this._values.push(value);
    this._category = 'var';

    // TODO: hack
    this._type = 'float';

    // int, float, string, boolean
    return this;
  }

  polygon(vertices) {
    validate(this, 'polygon');

    this._vertices = vertices;
    this._type = 'polygon2d';
    this._category = 'prim';
    return this;
  }

  polyline(vertices) {
    validate(this, 'polyline');

    this._vertices = vertices;
    this._type = 'line2d';
    this._category = 'prim';
    return this;
  }

  points(vertices) {
    validate(this, 'points');
    console.log(' points ');

    this._vertices = vertices;
    this._type = 'points3d';
    this._category = 'prim';
    return this;
  }

  color(clr) {
    validate(this, 'color');

    this._color = clr;
    return this;
  }

  id(identifier) {
    validate(this, 'id');

    this._id = identifier;
    return this;
  }

  classes(classList) {
    validate(this, 'classes');

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
