import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizTreeTableBuilder extends XvizBaseUiBuilder {
  constructor({stream, root}) {
    super({
      root,
      type: UI_TYPES.METRIC
    });
    this._stream = stream;
  }

  description(description) {
    this._description = description;
    return this;
  }

  title(title) {
    this._title = title;
    return this;
  }

  displayObjectId(displayObjectId) {
    this._displayObjectId = displayObjectId;
    return this;
  }

  interactions(interactions) {
    this._interactions = interactions;
    return this;
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
