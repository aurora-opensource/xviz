import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizPanelBuilder extends XvizBaseUiBuilder {
  constructor(props) {
    super(props);
    this._type = UI_TYPES.PANEL;
  }

  name(name) {
    this._name = name;
    return this;
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

    if (this._name) {
      obj.name = this._name;
    }

    if (this._layout) {
      obj.layout = this._layout;
    }

    if (this._interactions) {
      obj.interactions = this._interactions;
    }

    return obj;
  }
}
