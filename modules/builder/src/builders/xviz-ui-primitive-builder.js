/* eslint-disable camelcase */
import XVIZBaseBuilder from './xviz-base-builder';
import {CATEGORY, PRIMITIVE_TYPES} from './constant';

export default class XVIZUIPrimitiveBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.ui_primitive
    });

    this.reset();
    // primitives: {[streamId]: []}
    this._primitives = {};
  }

  columns(columns) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_columns');

    this._columns = columns;
    this._type = PRIMITIVE_TYPES.treetable;

    return this;
  }

  row(parentId, id, values) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_id');

    this._rowParent = parentId;
    this._rowId = id;
    this._rowValues = values;

    this._type = PRIMITIVE_TYPES.treetable;

    return this;
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

    const primitive = this._formatPrimitive();
    if (primitive) {
      primitiveArray.push(primitive);
    }

    this.reset();
  }

  _formatPrimitive() {
    const obj = {};

    switch (this._type) {
      case PRIMITIVE_TYPES.treetable:
        if (this._rowId !== null) {
          obj.id = this._rowId;
        } else {
          // missing required fields
          return null;
        }
        if (this._rowValues) {
          obj.column_values = this._rowValues;
        }
        if (this._rowParent !== null) {
          obj.parent = this._rowParent;
        }
        break;

      default:
    }

    return obj;
  }

  reset() {
    this._type = null;

    this._columns = null;
    this._rowId = null;
    this._rowParent = null;
    this._rowValues = null;
  }
}
