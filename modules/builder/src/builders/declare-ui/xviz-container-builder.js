import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizContainerBuilder extends XvizBaseUiBuilder {
  constructor(props) {
    super(props);
    this._type = UI_TYPES.CONTAINER;
  }

  layout(layout) {
    this._layout = layout;
    return this;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
  }

  getUI() {
    const obj = super.getUI();
    obj.type = this._type;

    if (this._layout) {
      obj.layout = this._layout;
    }
    if (this._interactions) {
      obj.interactions = this._interactions;
    }
    return obj;
  }
}
