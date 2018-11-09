import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XVIZPlotBuilder extends XVIZBaseUiBuilder {
  constructor({
    independentVariable,
    dependentVariable,
    description,
    title,
    validateWarn,
    validateError
  }) {
    super({
      type: UI_TYPES.PLOT,
      validateWarn,
      validateError
    });
    this._independentVariable = independentVariable;
    this._dependentVariable = dependentVariable;
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (!this._name) {
      this._validateError('Panel should have `name`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.independentVariable = this._independentVariable;
    obj.dependentVariable = this._dependentVariable;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
