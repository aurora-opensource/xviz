// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase */
import XVIZPoseBuilder from './xviz-pose-builder';
import XVIZPrimitiveBuilder from './xviz-primitive-builder';
import XVIZFutureInstanceBuilder from './xviz-future-instance-builder';
import XVIZUIPrimitiveBuilder from './xviz-ui-primitive-builder';
import XVIZTimeSeriesBuilder from './xviz-time-series-builder';
import XVIZValidator from './xviz-validator';
import XVIZVariableBuilder from './xviz-variable-builder';
import {PRIMARY_POSE_STREAM} from './constant';

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

    // Current streamBuilder
    this._streamBuilder = null;

    // Construct different builders
    this._poseBuilder = new XVIZPoseBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._variablesBuilder = new XVIZVariableBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._primitivesBuilder = new XVIZPrimitiveBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._futureInstanceBuilder = new XVIZFutureInstanceBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._uiPrimitivesBuilder = new XVIZUIPrimitiveBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
    this._timeSeriesBuilder = new XVIZTimeSeriesBuilder({
      metadata: this.metadata,
      validator: this._validator
    });
  }

  pose(streamId = PRIMARY_POSE_STREAM) {
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

  futureInstance(streamId, timestamp) {
    this._streamBuilder = this._futureInstanceBuilder.stream(streamId);
    this._streamBuilder._timestamp(timestamp);
    return this._streamBuilder;
  }

  uiPrimitive(streamId) {
    this._streamBuilder = this._uiPrimitivesBuilder.stream(streamId);
    return this._streamBuilder;
  }

  timeSeries(streamId) {
    this._streamBuilder = this._timeSeriesBuilder.stream(streamId);
    return this._streamBuilder;
  }

  /*
  frame data:
  {
    update_type: 'snapshot',
    updates: [{
      timestamp,
      poses: {'/vehicle-pose': {}, ...},
      primitives: {},
      variables: {},
      future_instances: {}
    }]
  }
   */
  getFrame() {
    const {poses} = this._poseBuilder.getData();

    if (!poses || !poses[PRIMARY_POSE_STREAM]) {
      this._validator.error(`Every frame requires a ${PRIMARY_POSE_STREAM} stream`);
    }

    const primitives = this._primitivesBuilder.getData();
    const futures = this._futureInstanceBuilder.getData();
    const variables = this._variablesBuilder.getData();
    const timeSeries = this._timeSeriesBuilder.getData();
    const uiPrimitives = this._uiPrimitivesBuilder.getData();

    const data = {
      timestamp: poses[PRIMARY_POSE_STREAM].timestamp,
      poses
    };

    if (primitives) {
      data.primitives = primitives;
    }
    if (futures) {
      data.future_instances = futures;
    }
    if (variables) {
      data.variables = variables;
    }
    if (timeSeries) {
      data.time_series = timeSeries;
    }
    if (uiPrimitives) {
      data.ui_primitives = uiPrimitives;
    }

    const frame = {
      update_type: 'snapshot',
      updates: [data]
    };

    return frame;
  }

  _reset() {
    this._streamBuilder = null;
  }
}
