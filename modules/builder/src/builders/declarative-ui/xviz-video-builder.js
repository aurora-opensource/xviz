import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizVideoBuilder extends XvizBaseUiBuilder {
  constructor({cameras, interactions, validateWarn, validateError}) {
    super({
      type: UI_TYPES.METRIC,
      validateWarn,
      validateError
    });
    this._cameras = cameras;
    this._interactions = interactions;

    this._validate();
  }

  _validate() {
    if (!this._cameras) {
      this._validateError('Video component should have `cameras`.');
    }
  }

  getUI() {
    const obj = super.getUI();
    obj.cameras = this._cameras;

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
