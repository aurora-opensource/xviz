import XvizComponent, {XVIZ_COMPONENT_TYPES} from './xviz-component';

export default class XvizPanel extends XvizComponent {
  constructor(props) {
    super(props);
    this._type = XVIZ_COMPONENT_TYPES.PANEL;
  }

  name(name) {
    this._name = name;
    return this;
  }

  getComponent() {
    const obj = super.getComponent();
    obj.type = this._type;

    if (this._name) {
      obj.name = this._name;
    }

    return obj;
  }
}
