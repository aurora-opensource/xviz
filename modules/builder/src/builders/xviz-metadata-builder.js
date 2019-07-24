// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase */
import {_Pose as Pose, Matrix4} from 'math.gl';
import {CATEGORY} from './constant';

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
      streams: {}
    };

    this.streamId = null;
    this.tmp_ui_builder = null;
    this.tmp_stream = {};
    this.tmp_matrix_transform = null;
    this.tmp_pose_transform = null;
    this.tmp_log_info = {};
    this.tmp_type = null;
    // TODO:
    // cameras
    // stream_aliases
    // ui_config
    // map_info
    // vehicle_info
  }

  getMetadata() {
    this._flush();

    const metadata = {
      version: '2.0.0',
      ...this.data
    };

    if (Object.keys(this.tmp_log_info).length > 0) {
      metadata.log_info = this.tmp_log_info;
    }
    if (this.tmp_ui_builder) {
      const panels = this.tmp_ui_builder.getUI();
      metadata.ui_config = {};

      // Wrap the individual panels in the ui_panel_info structure
      for (const panelKey of Object.keys(panels)) {
        metadata.ui_config[panelKey] = {
          name: panels[panelKey].name,
          config: panels[panelKey]
        };
      }
    }

    return metadata;
  }

  startTime(time) {
    this.tmp_log_info.start_time = time;
    return this;
  }

  endTime(time) {
    this.tmp_log_info.end_time = time;
    return this;
  }

  ui(xvizUIBuilder) {
    this.tmp_ui_builder = xvizUIBuilder;
    return this;
  }

  stream(streamId) {
    if (this.streamId) {
      this._flush();
    }

    this.streamId = streamId;
    return this;
  }

  // Used for validation in XVIZBuilder
  category(category) {
    this.tmp_stream.category = category.toUpperCase();
    return this;
  }

  // Used for validation in XVIZBuilder
  type(t) {
    this.tmp_type = t.toUpperCase();
    return this;
  }

  source(source) {
    this.tmp_stream.source = source;
    return this;
  }

  unit(u) {
    this.tmp_stream.units = u;
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

  streamStyle(style) {
    this.tmp_stream.stream_style = style;
    return this;
  }

  styleClass(name, style) {
    if (!this.streamId) {
      this._validateError('A stream must set before adding a style rule.');
      return this;
    }

    const streamRule = {
      name,
      style
    };

    if (!this.tmp_stream.style_classes) {
      this.tmp_stream.style_classes = [streamRule];
    } else {
      this.tmp_stream.style_classes.push(streamRule);
    }
    return this;
  }

  logInfo(data) {
    this.tmp_log_info = {...data, ...this.tmp_log_info};
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

      if (
        streamData.category === CATEGORY.PRIMITIVE ||
        streamData.category === CATEGORY.FUTURE_INSTANCE
      ) {
        streamData.primitive_type = this.tmp_type;
      } else if (
        streamData.category === CATEGORY.VARIABLE ||
        streamData.category === CATEGORY.TIME_SERIES
      ) {
        streamData.scalar_type = this.tmp_type;
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
    this.tmp_type = null;
  }
}
