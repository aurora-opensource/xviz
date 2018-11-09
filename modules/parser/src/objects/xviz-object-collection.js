import XVIZObject from './xviz-object';

export default class XVIZObjectCollection {
  constructor({ObjectType = XVIZObject} = {}) {
    // A map of all XVIZ objects, across time
    this.objects = new Map();
    this.ObjectType = ObjectType;
  }

  // Drop all XVIZ objects
  clear() {
    this.objects.clear();
  }

  count() {
    return this.objects.size;
  }

  // Create a new XVIZ object at timestamp if it does not exist.
  observe(id, timestamp) {
    if (id === undefined || id === null) {
      return;
    }
    // Map keys use strict equal
    id = id.toString();
    if (this.objects.has(id)) {
      const object = this.objects.get(id);
      object._observe(timestamp);
    } else {
      const object = new this.ObjectType({id, timestamp});
      this.objects.set(id, object);
    }
  }

  get(id) {
    if (id === undefined || id === null) {
      return null;
    }
    // Map keys use strict equal
    id = id.toString();
    return this.objects.get(id) || null;
  }

  // Clears all XVIZ object props for a fresh new frame.
  resetAll() {
    this.objects.forEach(object => object._reset());
  }

  // Returns all XVIZ objects
  getAll() {
    const result = {};
    this.objects.forEach((object, id) => {
      result[id] = object;
    });
    return result;
  }

  // Returns all XVIZ objects present in current frame
  getAllInCurrentFrame() {
    const result = {};
    this.objects.forEach((object, id) => {
      if (object.isValid) {
        result[id] = object;
      }
    });
    return result;
  }

  // Removes XVIZ objects that are outside of a time window
  prune(startTime, endTime) {
    const {objects} = this;
    const idsToRemove = [];

    objects.forEach((object, id) => {
      if (object.endTime < startTime || object.startTime > endTime) {
        idsToRemove.push(id);
      }
    });
    idsToRemove.forEach(id => {
      objects.delete(id);
    });
  }
}
