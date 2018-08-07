// Class to provide sdv object access helpers
import BaseObject from './base-object';
import {Vector3, degrees} from 'math.gl';
import assert from '../utils/assert';

export default class SDV extends BaseObject {
  // Set `validate` to `true` to throw exception if object cannot be initialized
  // If not, object will still be created as "uninitialized",
  // and member functions will just return null
  constructor({vehicleLog, validate = false}) {
    if (validate) {
      assert(validate || vehicleLog, 'sdv validate');
    }
    super();
    this.xvizLog = vehicleLog;
  }

  get isValid() {
    return this.xvizLog;
  }

  get position() {
    // TODO - vehicleLog.carPosition is object with 0, 1, 2 keys, not array which is why
    // we need to initialize this way
    // Needs to be fixed in API post-processing
    return this.xvizLog && new Vector3().copy(this.xvizLog.carPosition);
  }

  get bearing() {
    // Note: Heading should be transformed by Viewport modelMatrix
    return this.xvizLog && degrees(this.xvizLog.heading);
  }
}
