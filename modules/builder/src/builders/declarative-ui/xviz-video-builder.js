import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizMetricBuilder extends XvizBaseUiBuilder {
  constructor({cameras, root}) {
    super({
      root,
      type: UI_TYPES.METRIC
    });
    this._cameras = cameras;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
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
