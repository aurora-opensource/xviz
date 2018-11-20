import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

// WARNING: this is an unstable feature
export default class XVIZSelectBuilder extends XVIZBaseUiBuilder {
  constructor({stream, target, description, title, validateWarn, validateError}) {
    super({
      type: UI_TYPES.SELECT,
      validateWarn,
      validateError
    });
    this._stream = stream;
    this._target = target;
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (!this._stream) {
      this._validateError('Select should have `stream`.');
    }
    if (!this._target) {
      this._validateError('Select should have `target`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.stream = this._stream;
    obj.onchange = {
      target: this._target
    };

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
