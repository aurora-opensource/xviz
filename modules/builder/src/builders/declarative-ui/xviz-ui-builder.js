/* global console */
/* eslint-disable no-console */
import XvizPanelBuilder from './xviz-panel-builder';
import XvizMetricBuilder from './xviz-metric-builder';
import XvizContainerBuilder from './xviz-container-builder';
import {UI_TYPES} from './constants';

const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;

const UI_TYPE_MAP = {
  [UI_TYPES.PANEL]: XvizPanelBuilder,
  [UI_TYPES.METRIC]: XvizMetricBuilder,
  [UI_TYPES.CONTAINER]: XvizContainerBuilder
};

export default class XvizUIBuilder {
  constructor({validateWarn = defaultValidateWarn, validateError = defaultValidateError}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

    this._children = [];
    // maintain a builder list
    // when builder.done called, pop up the last builder
    this._builders = [this];
  }

  [`${UI_TYPES.PANEL}Left`](props) {
    return this._setChild(UI_TYPES.PANEL, props);
  }

  [`${UI_TYPES.CONTAINER}Left`](props) {
    if (this._builders.length === 1) {
      this._validateError('Add a panel first');
    }
    return this._setChild(UI_TYPES.CONTAINER, props);
  }

  [`${UI_TYPES.METRIC}Left`](props) {
    if (this._builders.length === 1) {
      this._validateError('Add a panel first');
    }
    return this._setChild(UI_TYPES.METRIC, props);
  }

  [`${UI_TYPES.PANEL}Right`]() {
    return this.done();
  }

  [`${UI_TYPES.CONTAINER}Right`]() {
    return this.done();
  }

  [`${UI_TYPES.METRIC}Right`]() {
    return this.done();
  }

  getUI() {
    return this._children.map(child => child.getUI());
  }

  child(child) {
    if (!(child instanceof XvizPanelBuilder)) {
      this._validateError('Top level UI element should be `Panel`');
    }
    this._children.push(child);
    return this;
  }

  done() {
    this._builders.pop();
    return this;
  }

  _createUIBuilder(type, props) {
    return new UI_TYPE_MAP[type]({
      ...props,
      root: this
    });
  }

  _getLastBuilder() {
    return this._builders[this._builders.length - 1];
  }

  _setChild(type, props) {
    const child = this._createUIBuilder(type, props);
    const parent = this._getLastBuilder();

    parent.child(child);
    this._builders.push(child);

    return child;
  }
}
