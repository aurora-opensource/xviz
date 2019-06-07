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

/* eslint-disable camelcase */
import XVIZBaseBuilder from './xviz-base-builder';
import {CATEGORY, PRIMITIVE_TYPES} from './constant';

class XVIZTreeTableRowBuilder {
  constructor(id, values, parent = null) {
    this._parent = parent;
    this._id = id;
    this._values = values;
    this._children = [];
  }

  child(id, values) {
    const row = new XVIZTreeTableRowBuilder(id, values, this._id);
    this._children.push(row);
    return row;
  }

  getData() {
    const obj = {id: this._id};
    if (this._values) {
      obj.column_values = this._values;
    }
    if (this._parent !== null) {
      obj.parent = this._parent;
    }

    return [].concat.apply([obj], this._children.map(row => row.getData()));
  }
}

export default class XVIZUIPrimitiveBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.UI_PRIMITIVE
    });

    this.reset();
    // primitives: {[streamId]: []}
    this._primitives = {};
  }

  treetable(columns) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_columns');

    this._columns = columns;
    this._type = PRIMITIVE_TYPES.treetable;

    return this;
  }

  row(id, values) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_id');

    this._row = new XVIZTreeTableRowBuilder(id, values);
    this._type = PRIMITIVE_TYPES.treetable;

    return this._row;
  }

  _validate() {
    super._validate();
  }

  _flush() {
    this._validate();

    this._flushPrimitives();
  }

  getData() {
    if (this._type) {
      this._flush();
    }

    if (Object.keys(this._primitives).length) {
      return this._primitives;
    }

    return null;
  }

  _flushPrimitives() {
    let stream = this._primitives[this._streamId];
    if (!stream) {
      stream = {};
      this._primitives[this._streamId] = stream;
    }

    let fieldName;
    let primitiveArray;

    switch (this._type) {
      case PRIMITIVE_TYPES.treetable:
        fieldName = this._type;
        if (!stream[fieldName]) {
          // column must be set before adding rows
          this._validator.hasProp(this, '_columns');

          stream[fieldName] = {
            columns: this._columns,
            nodes: []
          };
        }
        primitiveArray = stream[fieldName].nodes;
        break;

      default:
    }

    const primitives = this._formatPrimitives();
    if (primitives) {
      for (const primitive of primitives) {
        primitiveArray.push(primitive);
      }
    }

    this.reset();
  }

  _formatPrimitives() {
    switch (this._type) {
      case PRIMITIVE_TYPES.treetable:
        if (this._row !== null) {
          return this._row.getData();
        }
        break;

      default:
    }

    return null;
  }

  reset() {
    this._type = null;

    this._columns = null;
    this._row = null;
  }
}
