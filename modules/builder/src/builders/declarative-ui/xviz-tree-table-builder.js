import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizTreeTableBuilder extends XvizBaseUiBuilder {
  constructor({
    stream,
    description,
    title,
    displayObjectId,
    interactions,
    validateWarn,
    validateError
  }) {
    super({
      type: UI_TYPES.METRIC,
      validateWarn,
      validateError
    });
    this._stream = stream;
    this._description = description;
    this._title = title;
    this._displayObjectId = displayObjectId;
    this._interactions = interactions;

    this._validate();
  }

  _validate() {
    if (!this._stream) {
      this._validateError('TreeTable component should have `stream`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.stream = this._stream;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    if (this._displayObjectId) {
      obj.displayObjectId = this._displayObjectId;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
