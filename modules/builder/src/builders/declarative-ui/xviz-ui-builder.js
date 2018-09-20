/* global console */
/* eslint-disable no-console */
import XvizPanelBuilder from './xviz-panel-builder';

import XvizContainerBuilder from './xviz-container-builder';

import XvizMetricBuilder from './xviz-metric-builder';
import XvizPlotBuilder from './xviz-plot-builder';
import XvizTableBuilder from './xviz-table-builder';
import XvizTreeTableBuilder from './xviz-table-builder';
import XvizVideoBuilder from './xviz-video-builder';

import {snakeToCamel} from './utils';
import {UI_TYPES} from './constants';

const defaultValidateWarn = console.warn;
const defaultValidateError = console.error;

const UI_BUILDER_MAP = {
  [UI_TYPES.PANEL]: XvizPanelBuilder,

  [UI_TYPES.CONTAINER]: XvizContainerBuilder,

  [UI_TYPES.METRIC]: XvizMetricBuilder,
  [UI_TYPES.PLOT]: XvizPlotBuilder,
  [UI_TYPES.TABLE]: XvizTableBuilder,
  [UI_TYPES.TREE_TABLE]: XvizTreeTableBuilder,
  [UI_TYPES.VIDEO]: XvizVideoBuilder
};

export default class XvizUIBuilder {
  constructor({validateWarn = defaultValidateWarn, validateError = defaultValidateError}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;

    this._children = [];
    // maintain a builder list
    // when builder.done called, pop up the last builder
    this._builders = [this];

    Object.values(UI_TYPES).map(type => {
      // add UI builders, e.g.
      // type `panel`
      //  - this.panelLeft = (props) => this._setChild('panel', props);
      //  - this.panelRight = () => this.done();
      const camelType = snakeToCamel(type);
      this[`${camelType}Left`] = props => {
        if (type !== UI_TYPES.PANEL && this._builders.length === 1) {
          this._validateError('Add a panel first');
        }
        return this._setChild(type, props);
      };
      this[`${camelType}Right`] = () => this.done();
    });
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
    return new UI_BUILDER_MAP[type]({
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
