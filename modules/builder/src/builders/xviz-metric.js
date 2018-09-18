import XvizComponent, {XVIZ_COMPONENT_TYPES} from './xviz-component';

export default class XvizMetric extends XvizComponent {
  constructor(props) {
    super(props);
    this._type = XVIZ_COMPONENT_TYPES.METRIC;
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

  getComponent() {
    const obj = super.getComponent();
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
