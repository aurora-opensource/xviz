// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase*/
import {_Pose as Pose, Matrix4} from 'math.gl';

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
    if (matrix instanceof Array) {
      matrix = new Matrix4(matrix);
    }

    this.tmp_matrix_transform = matrix;
    return this;
  }

  pose(position = {}, orientation = {}) {
    const {x = 0, y = 0, z = 0} = position;
    const {roll = 0, pitch = 0, yaw = 0} = orientation;
    const pose = new Pose({x, y, z, roll, pitch, yaw});
    this.tmp_pose_transform = pose.getTransformationMatrix();
    return this;
  }

  styleClassDefault(style) {
    this.styleClass('*', style);
    return this;
  }

  styleClass(className, style) {
    if (!this.streamId) {
      this._validateError('A stream must set before adding a style rule.');
      return this;
    }

    const streamRule = {
      ...style,
      class: className
    };

    if (!this.data.styles[this.streamId]) {
      this.data.styles[this.streamId] = [streamRule];
    } else {
      this.data.styles[this.streamId].push(streamRule);
    }
    return this;
  }

  _flush() {
    if (this.streamId) {
      const streamData = this.tmp_stream;

      let transform = null;
      if (this.tmp_pose_transform && this.tmp_matrix_transform) {
        this._validateError('`pose` and `transformMatrix` cannot be applied at the same time.');
      } else {
        transform = this.tmp_matrix_transform || this.tmp_pose_transform;
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
    this.tmp_matrix_transform = null;
    this.tmp_pose_transform = null;
  }
}
