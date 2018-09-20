import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizMetricBuilder extends XvizBaseUiBuilder {
  constructor({streams, root}) {
    super({
      root,
      type: UI_TYPES.METRIC
    });
    this._streams = streams;
  }

  description(description) {
    this._description = description;
    return this;
  }

  title(title) {
    this._title = title;
    return this;
  }

  metric() {
    this._root.done();
    return this._root;
  }

  getUI() {
    const obj = super.getUI();
    obj.streams = this._streams;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    return obj;
  }
}
