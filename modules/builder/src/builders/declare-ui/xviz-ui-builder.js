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

    this._panels = [];
    this._refs = [];
  }

  panel() {
    if (this._refs && this._refs[0]) {
      this._flush();
    }

    const builder = this._createUIBuilder(UI_TYPES.PANEL);

    this._refs.push(builder);

    return builder;
  }

  container() {
    return this._child('container');
  }

  metric() {
    return this._child('metric');
  }

  getUI() {
    if (this._refs && this._refs[0]) {
      this._flush();
    }
    const res = [...this._panels];
    this._panels = [];
    return res;
  }

  done() {
    this._refs.pop();
    return this;
  }

  _flush() {
    const panel = this._refs[0];
    const panelObj = panel.getUI();
    this._panels.push(panelObj);
    this._reset();
  }

  _reset() {
    this._refs = [];
  }

  _createUIBuilder(type) {
    return new UI_TYPE_MAP[type]({
      root: this,
      validateWarn: this._validateWarn,
      validateError: this._validateError
    });
  }

  _getLastBuilder() {
    return this._refs[this._refs.length - 1];
  }

  _child(type) {
    if (this._refs.length === 0) {
      this._validateError('Add a panel first');
    }

    const child = this._createUIBuilder(type);
    const parent = this._getLastBuilder();

    parent.child(child);
    this._refs.push(child);

    return child;
  }
}
