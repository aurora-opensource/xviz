import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XVIZPlotBuilder extends XVIZBaseUiBuilder {
  constructor({
    independentVariable,
    dependentVariables,
    regions,
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
    this._dependentVariables = dependentVariables;
    this._regions = regions;
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (this._independentVariable) {
      if (!this._dependentVariables) {
        this._validateError('Plot should have `dependentVariables`.');
      }
    } else if (!this._regions) {
      this._validateError('Plot should have either `independentVariable` or `regions`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    if (this._independentVariable) {
      obj.independentVariable = this._independentVariable;
      obj.dependentVariables = this._dependentVariables;
    }

    if (this._regions) {
      obj.regions = this._regions;
    }

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
