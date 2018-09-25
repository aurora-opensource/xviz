import {snakeToCamel} from './utils';

export default class XvizBaseUiBuilder {
  constructor({root, type}) {
    this._type = type;
    this._children = null;
    this._root = root;

    // end chaining of this builder and go back to root builder
    this[`${snakeToCamel(this._type)}Right`] = () => this._done();
  }

  // add child
  child(child) {
    if (!this._children) {
      this._children = [];
    }
    this._children.push(child);
    return this;
  }

  // start appending children to current UI element
  children() {
    return this._root;
  }

  getUI() {
    const obj = {type: this._type};
    if (this._children && this._children.length) {
      obj.children = this._children.map(child => child.getUI());
    }
    return obj;
  }

  // done with current UI element builder
  _done() {
    this._root.done();
    return this._root;
  }
}
