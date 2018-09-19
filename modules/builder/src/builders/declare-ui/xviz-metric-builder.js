import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizMetricBuilder extends XvizBaseUiBuilder {
  constructor(props) {
    super(props);
    this._type = UI_TYPES.METRIC;
  }

  streams(streams) {
    this._streams = streams;
    return this;
  }

  description(description) {
    this._description = description;
    return this;
  }

  title(title) {
    this._title = title;
    return this;
  }

  getUI() {
    const obj = super.getUI();
    obj.type = this._type;

    if (this._title) {
      obj.title = this._title;
    }

    if (this._description) {
      obj.description = this._description;
    }

    if (this._streams) {
      obj.streams = this._streams;
    }

    return obj;
  }
}
