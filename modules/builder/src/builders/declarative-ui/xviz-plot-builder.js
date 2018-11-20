import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XVIZPlotBuilder extends XVIZBaseUiBuilder {
  constructor({
    independentVariable,
    dependentVariables,
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
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (this._independentVariable) {
      if (!this._dependentVariables) {
        this._validateError('Plot should have `dependentVariables`.');
      }
    } else {
      this._validateError('Plot should have `independentVariable`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.independentVariable = this._independentVariable;
    obj.dependentVariables = this._dependentVariables;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
