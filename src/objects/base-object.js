// Base class for log objects
export default class BaseObject {
  get isValid() {
    return false;
  }

  get position() {
    return null;
  }

  get bearing() {
    return null;
  }
}
