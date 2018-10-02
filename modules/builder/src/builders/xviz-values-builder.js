import XVIZBaseBuilder from './xviz-base-builder';
import {VARIABLE_TYPES} from './constant';

export default class XVIZValuesBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super(props);

    this._data = null;
    this.reset();
  }

  flush() {
    this.validate();

    super.flush();

    if (!this._data) {
      this._data = {};
    }
    this._data[this.streamId] = {
      timestamps: this._timestamps,
      values: this._values,
      type: this._type
    };

    this.reset();
  }

  getData() {
    if (this._type) {
      this.flush();
    }

    return {
      variables: this._data
    };
  }

  getVariableType(value) {
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

    return null;
  }

  validate() {
    super.validate();

    if (this._values.length === 0) {
      this.validateWarn(`Stream${this.streamId} value(s) are not provided.`);
    }
    if (this._timestamps.length === 0) {
      this.validateWarn(`Stream${this.streamId} timestamp are not provided.`);
    }
    if (this._values.length !== this._timestamps.length) {
      this.validateWarn(
        `Stream${this.streamId} length of values and length of timestamps are not equal.`
      );
    }
    if (!this._type) {
      this.validateWarn(`Stream${this.streamId} variable type is not recognized.`);
    }
  }

  reset() {
    this._type = null;
    this._values = [];
    this._timestampes = [];
  }
}
