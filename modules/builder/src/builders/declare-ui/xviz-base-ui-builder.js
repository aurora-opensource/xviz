export default class XvizBaseUiBuilder {
  constructor({root}) {
    this._type = null;
    this._children = null;
    this._root = root;
  }

  child(child) {
    if (!this._children) {
      this._children = [];
    }
    this._children.push(child);
    return this;
  }

  children() {
    return this._root;
  }

  done() {
    this._root.done();
    return this._root;
  }

  getUI() {
    const obj = {type: this._type};
    if (this._children && this._children.length) {
      obj.children = this._children.map(child => child.getUI());
    }
    return obj;
  }
}
