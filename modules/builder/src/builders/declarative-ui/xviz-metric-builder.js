import XvizBaseUiBuilder from './xviz-base-ui-builder';
import {UI_TYPES} from './constants';

export default class XvizMetricBuilder extends XvizBaseUiBuilder {
  constructor({streams, description, title, validateWarn, validateError}) {
    super({
      type: UI_TYPES.METRIC,
      validateWarn,
      validateError
    });
    this._streams = streams;
    this._description = description;
    this._title = title;

    this._validate();
  }

  _validate() {
    if (!this._streams || !this._streams.length) {
      this._validateError('Metric component should have `streams`.');
    }
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
