/* XVIZBaseBuilder provides validation and category information
 * shared across all builders.
 */
export default class XVIZBaseBuilder {
  constructor({validator, category, metadata}) {
    this._streamId = null;
    this._category = category;
    this._metadata = metadata;

    this._validator = validator;
  }

  stream(streamId) {
    if (this._streamId) {
      this._flush();
    }

    this._streamId = streamId;
    return this;
  }

  getStreamId() {
    return this._streamId;
  }

  getCategory() {
    return this._category;
  }

  getMetadata() {
    return this._metadata;
  }

  _flush() {
    throw new Error('Derived class must implement the "_flush()" method.');
  }

  _reset() {
    this._category = null;
  }

  _validate() {
    this._validator.hasProp(this, '_streamId');
    this._validator.hasProp(this, '_category');
    this._validator.matchMetadata(this);
  }

  validateWarn(msg) {
    this._validator.warn(msg);
  }

  validateError(msg) {
    this._validator.error(msg);
  }

  validatePropSetOnce(prop) {
    this._validator.propSetOnce(this, prop);
  }
}
