// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase */
import XVIZPoseBuilder from './xviz-pose-builder';
import XVIZPrimitiveBuilder from './xviz-primitive-builder';
import XVIZTimeSeriesBuilder from './xviz-time-series-builder';
import XVIZValidator from './xviz-validator';
import XvizVariableBuilder from './xviz-variable-builder';
import {VEHICLE_POSE_STREAM_NAME} from './constant';

/* global console */
/* eslint-disable no-console */
const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;
/* eslint-enable no-console */

// TODO: Builder could validate against stream metadata!
export default class XVIZBuilder {
  constructor({
    metadata = {},
    disableStreams = [],
    validateWarn = defaultValidateWarn,
    validateError = defaultValidateError
  } = {}) {
    this._validator = new XVIZValidator({
      validateWarn,
      validateError
    });

    this.metadata = metadata;
    this.disableStreams = disableStreams;

    this._pose = null;

    // Current streamBuilder
    this._streamBuilder = null;

    // Construct different builders
    this._poseBuilder = new XVIZPoseBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._variablesBuilder = new XvizVariableBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._primitivesBuilder = new XVIZPrimitiveBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._timeSeriesBuilder = new XVIZTimeSeriesBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
  }

  pose(streamId = '/vehicle_pose') {
    this._streamBuilder = this._poseBuilder.stream(streamId);
    return this._streamBuilder;
  }

  variable(streamId) {
    this._streamBuilder = this._variablesBuilder.stream(streamId);
    return this._streamBuilder;
  }

  primitive(streamId) {
    this._streamBuilder = this._primitivesBuilder.stream(streamId);
    return this._streamBuilder;
  }

  timeSeries(streamId) {
    this._streamBuilder = this._timeSeriesBuilder.stream(streamId);
    return this._streamBuilder;
  }

  /*
  frame data: {
    state_updates: [{
      poses: {
      '/vehicle-pose': {},
      ...
      },
      primitives: {},
      variables: {},
      futures: {}
    }]
  }
   */
  getFrame() {
    const {poses} = this._poseBuilder.getData();

    if (!poses || !poses[VEHICLE_POSE_STREAM_NAME]) {
      this._validator.error(`Every frame requires a ${VEHICLE_POSE_STREAM_NAME} stream`);
    }

    const {primitives, futures} = this._primitivesBuilder.getData();
    const {variables} = this._variablesBuilder.getData();
    const {variables: timeSeries} = this._timeSeriesBuilder.getData();

    const data = {
      timestamp: poses[VEHICLE_POSE_STREAM_NAME].timestamp,
      poses
    };

    if (primitives) {
      data.primitives = primitives;
    }
    if (futures) {
      data.futures = futures;
    }
    if (variables) {
      data.variables = data.variables || {};
      Object.assign(data.variables, variables);
    }
    if (timeSeries) {
      data.variables = data.variables || {};
      Object.assign(data.variables, timeSeries);
    }

    const frame = {
      state_updates: [data]
    };

    return frame;
  }

  _reset() {
    this._streamBuilder = null;
  }
}
