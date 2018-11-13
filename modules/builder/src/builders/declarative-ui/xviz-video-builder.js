import XVIZBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XVIZVideoBuilder extends XVIZBaseUiBuilder {
  constructor({cameras, interactions, validateWarn, validateError}) {
    super({
      type: UI_TYPES.VIDEO,
      validateWarn,
      validateError
    });
    this._cameras = cameras;

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

    return obj;
  }
}
