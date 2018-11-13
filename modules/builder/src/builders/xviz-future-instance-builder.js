/* eslint-disable camelcase */
import XVIZPrimitiveBuilder from './xviz-primitive-builder';
import {insertTimestamp} from '../utils';
import {CATEGORY} from './constant';

export default class XVIZFutureInstanceBuilder extends XVIZPrimitiveBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.future_instance
    });

    this.reset();
    // futures: {[streamId]: {...,timestamps: [], primitives: []}}
    this._futures = {};
  }

  _timestamp(timestamp) {
    this._ts = timestamp;
    return this;
  }

  _flush() {
    let future = this._futures[this._streamId];
    if (!future) {
      future = {
        timestamps: [],
        primitives: []
      };
      this._futures[this._streamId] = future;
    }

    const primitive = this._formatPrimitive();

    const {timestamps, primitives} = future;

    // Each type like "image" has an "images" array, this hack saves a
    // big switch statement.
    const update = {};
    update[`${this._type}s`] = [primitive];

    // insert ts and primitive to the position based on timestamp order
    insertTimestamp(timestamps, primitives, this._ts, `${this._type}s`, primitive);

    this.reset();
  }

  getData() {
    if (this._type) {
      this._flush();
    }

    if (Object.keys(this._futures).length === 0) {
      return null;
    }

    return this._futures;
  }

  reset() {
    super.reset();
  }
}
