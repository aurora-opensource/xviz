/* global console */
/* eslint-disable no-console */
import XvizBaseUI from './xviz-base-ui-builder';
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

export default class XvizUiBuilder {
  constructor({validateWarn = defaultValidateWarn, validateError = defaultValidateError}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

    this._panels = [];
    this._refs = [];
  }

  panel(name) {
    if (this._refs && this._refs[0] instanceof XvizBaseUI) {
      this._flush();
    }

    const ui = this._getXvizBaseUI(UI_TYPES.PANEL);
    ui.name(name);
    this._refs.push(ui);

    return this;
  }

  _getXvizBaseUI(type) {
    return new UI_TYPE_MAP[type]({
      validateWarn: this._validateWarn,
      validateError: this._validateError
    });
  }

  _child(type) {
    if (this._refs.length === 0) {
      this._validateError('Add a panel first');
    }

    const ui = this._getXvizBaseUI(type);
    this._refs.push(ui);
    return ui;
  }

  container() {
    this._child('container');
    return this;
  }

  _getUI() {
    return this._refs[this._refs.length - 1];
  }

  // XvizContainerBuilder
  layout(layout) {
    const ui = this._getUI();
    if (ui[layout]) {
      this._validateError(`${ui.type} does not support 'layout'`);
    }
    ui.layout(layout);
    return this;
  }

  // XvizPanelBuilder
  name(name) {
    const ui = this._getUI();
    if (ui[name]) {
      this._validateError(`${ui.type} does not support 'name'`);
    }
    ui.name(name);
    return this;
  }

  // XvizMetricBuilder
  streams(streams) {
    const ui = this._getUI();
    if (ui[streams]) {
      this._validateError(`${ui.type} does not support 'streams'`);
    }
    ui.streams(streams);
    return this;
  }

  description(description) {
    const ui = this._getUI();
    if (ui[description]) {
      this._validateError(`${ui.type} does not support 'description'`);
    }
    ui.description(description);
    return this;
  }

  title(title) {
    const ui = this._getUI();
    if (ui[title]) {
      this._validateError(`${ui.type} does not support 'title'`);
    }
    ui.title(title);
    return this;
  }

  metric() {
    this._child('metric');
    return this;
  }

  _flush() {
    const panelObj = this._refs[0].getUI();
    this._panels.push(panelObj);
    this._reset();
  }

  _reset() {
    this._refs = [];
  }

  done() {
    const child = this._refs.pop();
    const lastRef = this._refs[this._refs.length - 1];
    lastRef.child(child);

    return this;
  }

  getUI() {
    if (this._refs && this._refs[0] instanceof XvizBaseUI) {
      this._flush();
    }
    const res = [...this._panels];
    this._panels = [];
    return res;
  }
}
