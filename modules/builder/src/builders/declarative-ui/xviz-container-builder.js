import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizContainerBuilder extends XvizBaseUiBuilder {
  constructor({name, root}) {
    super({
      root,
      type: UI_TYPES.CONTAINER
    });
    this._name = name;
  }

  layout(layout) {
    this._layout = layout;
    return this;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
  }

  container() {
    this._root.done();
    return this._root;
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
