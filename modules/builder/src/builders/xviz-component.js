export const XVIZ_COMPONENT_TYPES = {
  CONTAINER: 'container',
  METRIC: 'metric',
  PANEL: 'panel'
};

export default class XvizComponent {
  constructor() {
    this._type = null;
    this._children = null;
  }

  child(child) {
    if (!this._children) {
      this._children = [];
    }
    this._children.push(child);
    return this;
  }

  getComponent() {
    const obj = {type: this._type};
    if (this._children && this._children.length) {
      obj.children = this._children.map(child => child.getComponent());
    }
    return obj;
  }
}
