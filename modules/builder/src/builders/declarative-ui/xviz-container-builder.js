import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizContainerBuilder extends XvizBaseUiBuilder {
  constructor({name, layout, interactions, validateWarn, validateError}) {
    super({
      type: UI_TYPES.CONTAINER,
      validateWarn,
      validateError
    });

    this._name = name;
    this._layout = layout;
    this._interactions = interactions;

    this._validate();
  }

  _validate() {
    if (!this._name) {
      this._validateError('Container should have `name`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.name = this._name;

    if (this._layout) {
      obj.layout = this._layout;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }
    return obj;
  }
}
