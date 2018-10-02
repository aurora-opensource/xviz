export default class XVIZBaseBuilder {
  constructor({validator, category, metadata}) {
    this.category = category;
    this.metadata = metadata;

    this._validator = validator;
  }

  stream(streamId) {
    if (this.streamId) {
      this.flush();
    }

    this.streamId = streamId;
    return this;
  }

  getStreamId() {
    return this.streamId;
  }

  getCategory() {
    return this.category;
  }

  getMetadata() {
    return this.metadata;
  }

  reset() {
    this.streamId = null;
    this.category = null;
  }

  flush() {}

  getData() {
    return null;
  }

  validate() {
    this._validator.hasProp(this, 'streamId');
    this._validator.hasProp(this, 'category');
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
