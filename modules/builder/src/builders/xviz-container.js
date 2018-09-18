import XVIZComponent, {XVIZ_COMPONENT_TYPES} from './xviz-component';

export default class XvizContainer extends XVIZComponent {
  constructor(props) {
    super(props);
    this._type = XVIZ_COMPONENT_TYPES.CONTAINER;
  }

  layout(layout) {
    this._layout = layout;
    return this;
  }

  getComponent() {
    const obj = super.getComponent();
    obj.type = this._type;

    if (this._layout) {
      obj.layout = this._layout;
    }
    return obj;
  }
}
