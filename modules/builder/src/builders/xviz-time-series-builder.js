import {CATEGORY} from './constant';
import XVIZValuesBuilder from './xviz-values-builder';

export default class XVIZTimeSeriesBuilder extends XVIZValuesBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.time_series
    });

    this._values = [];
  }

  value(value) {
    if (value instanceof Array) {
      this.validateError('Input `value` should be single value');
    }

    this.validatePropSetOnce('_values');

    this._values.push(value);
    this._type = this.getVariableType(value);

    return this;
  }

  timestamp(timestamp) {
    if (timestamp instanceof Array) {
      this.validateError('Input `timestamp` should be a single value');
    }

    this.validatePropSetOnce('_timestamps');

    this._timestamps = [timestamp];

    return this;
  }
}
