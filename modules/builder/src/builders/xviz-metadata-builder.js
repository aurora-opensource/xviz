// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase*/

/* global console */
/* eslint-disable no-console */
const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;
/* eslint-enable no-console */

export default class XVIZMetadataBuilder {
  constructor({validateWarn = defaultValidateWarn, validateError = defaultValidateError} = {}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

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

  pose(p) {
    this.tmp_stream.pose = p;
    return this;
  }

  styleClassDefault(style) {
    this.styleClass('*', style);
    return this;
  }

  styleClass(className, style) {
    if (!this.stream_id) {
      this._validateError('A stream must set before adding a style rule.');
      return this;
    }

    const streamRule = {
      ...style,
      class: className
    };

    if (!this.data.styles[this.stream_id]) {
      this.data.styles[this.stream_id] = [streamRule];
    } else {
      this.data.styles[this.stream_id].push(streamRule);
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
