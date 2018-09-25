import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizPlotBuilder extends XvizBaseUiBuilder {
  constructor({independentVariable, dependentVariable, root}) {
    super({
      root,
      type: UI_TYPES.PLOT
    });
    this._independentVariable = independentVariable;
    this._dependentVariable = dependentVariable;
  }

  description(description) {
    this._description = description;
    return this;
  }

  title(title) {
    this._title = title;
    return this;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
  }

  getUI() {
    const obj = super.getUI();
    obj.streams = this._streams;
    obj.independentVariable = this._independentVariable;
    obj.dependentVariable = this._dependentVariable;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
