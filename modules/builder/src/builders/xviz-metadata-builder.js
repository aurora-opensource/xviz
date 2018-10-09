// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase*/
import {_Pose as Pose, Matrix4} from 'math.gl';

/* global console */
/* eslint-disable no-console */
const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;
/* eslint-enable no-console */

export default class XVIZMetadataBuilder {
  constructor(options = {}) {
    this._validateWarn = options.validateWarn || defaultValidateWarn;
    this._validateError = options.validateError || defaultValidateError;

    this.data = {
      streams: {},
      styles: {}
    };

    this.streamId = null;
    this.tmp_stream = {};
  }

  getMetadata() {
    this._flush();

    return {
      type: 'metadata',
      ...this.data
    };
  }

  startTime(time) {
    this.data.start_time = time;
    return this;
  }

  endTime(time) {
    this.data.end_time = time;
    return this;
  }

  stream(streamId) {
    if (this.streamId) {
      this._flush();
    }

    this.streamId = streamId;
    return this;
  }

  category(category) {
    this.tmp_stream.category = category;
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

  coordinate(coordinate) {
    this.tmp_stream.coordinate = coordinate;
    return this;
  }

  transformMatrix(matrix) {
    if (this.tmp_stream.pose) {
      this._validateWarn('`pose` and `transformMatrix` can not be applied at the same time.');
    }

    if (matrix instanceof Array) {
      matrix = new Matrix4(matrix);
    }

    this.tmp_stream.matrix = matrix;
    return this;
  }

  pose(p) {
    if (this.tmp_stream.matrix) {
      this._validateWarn('`pose` and `transformMatrix` can not be applied at the same time.');
    }
    this.tmp_stream.pose = p;
    return this;
  }

  styleClassDefault(style) {
    this.styleClass('*', style);
    return this;
  }

  styleClass(className, style) {
    if (!this.data.styles[this.streamId]) {
      this.data.styles[this.streamId] = {
        [className]: style
      };
    } else {
      this.data.styles[this.streamId][className] = style;
    }
    return this;
  }

  _flush() {
    if (this.streamId) {
      const {pose, matrix, ...others} = this.tmp_stream;

      const streamData = {...others};

      let transform = null;
      if (matrix) {
        transform = matrix;
      } else if (pose) {
        transform = new Pose(pose).getTransformationMatrix();
      }
      if (transform) {
        streamData.transform = transform;
      }

      this.data.streams[this.streamId] = streamData;
    }

    this._reset();
  }

  _reset() {
    this.streamId = null;
    this.tmp_stream = {};
  }
}
