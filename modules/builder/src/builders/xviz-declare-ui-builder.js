/* global console */
/* eslint-disable no-console */
import XvizComponent, {XVIZ_COMPONENT_TYPES} from './xviz-component';
import XvizPanel from './xviz-panel';
import XvizMetric from './xviz-metric';
import XvizContainer from './xviz-container';

const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;

const COMPONENT_TYPE_MAP = {
  [XVIZ_COMPONENT_TYPES.PANEL]: XvizPanel,
  [XVIZ_COMPONENT_TYPES.METRIC]: XvizMetric,
  [XVIZ_COMPONENT_TYPES.CONTAINER]: XvizContainer
};

export default class XvizDeclareUIBuilder {
  constructor({validateWarn = defaultValidateWarn, validateError = defaultValidateError}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

    this._panels = [];
    this._refs = [];
  }

  panel(name) {
    if (this._refs && this._refs[0] instanceof XvizComponent) {
      this._flush();
    }

    const component = this._getXvizComponent(XVIZ_COMPONENT_TYPES.PANEL);
    component.name(name);
    this._refs.push(component);

    return this;
  }

  _getXvizComponent(type) {
    return new COMPONENT_TYPE_MAP[type]({
      validateWarn: this._validateWarn,
      validateError: this._validateError
    });
  }

  _child(type) {
    if (this._refs.length === 0) {
      this._validateError('Add a panel first');
    }

    const component = this._getXvizComponent(type);
    this._refs.push(component);
    return component;
  }

  container() {
    this._child('container');
    return this;
  }

  _getComponent() {
    return this._refs[this._refs.length - 1];
  }

  // XvizContainer
  layout(layout) {
    const component = this._getComponent();
    if (component[layout]) {
      this._validateError(`${component.type} does not support 'layout'`);
    }
    component.layout(layout);
    return this;
  }

  // XvizPanel
  name(name) {
    const component = this._getComponent();
    if (component[name]) {
      this._validateError(`${component.type} does not support 'name'`);
    }
    component.name(name);
    return this;
  }

  // XvizMetric
  streams(streams) {
    const component = this._getComponent();
    if (component[streams]) {
      this._validateError(`${component.type} does not support 'streams'`);
    }
    component.description(streams);
    return this;
  }

  description(description) {
    const component = this._getComponent();
    if (component[description]) {
      this._validateError(`${component.type} does not support 'description'`);
    }
    component.description(description);
    return this;
  }

  title(title) {
    const component = this._getComponent();
    if (component[title]) {
      this._validateError(`${component.type} does not support 'title'`);
    }
    component.title(title);
    return this;
  }

  metric() {
    this._child('metric');
    return this;
  }

  _flush() {
    const panelObj = this._refs[0].getComponent();
    this._panels.push(panelObj);
    this._reset();
  }

  _reset() {
    this._refs = [];
  }

  end() {
    const child = this._refs.pop();
    const lastRef = this._refs[this._refs.length - 1];
    lastRef.child(child);

    return this;
  }

  getDeclareUI() {
    if (this._refs && this._refs[0] instanceof XvizComponent) {
      this._flush();
    }
    const res = [...this._panels];
    this._panels = [];
    return res;
  }
}
