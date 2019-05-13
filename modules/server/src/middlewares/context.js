/* XVIZMiddlewareContext provides state shared across
 * the middleware stack.  It includes
 * both general state about the sesson as well
 * as private state for an particular middleware
 * component.
 */
export class XVIZMiddlewareContext {
  constructor(state) {
    this.map = new Map(Object.entries(state));
    this.transforms = new Map();
  }

  set(name, val) {
    this.map.set(name, val);
  }

  get(name) {
    return this.map.get(name);
  }

  startTransform(id, state) {
    this.transforms.set(id, state);
  }

  transform(id) {
    return this.transforms.get(id);
  }

  endTransform(id) {
    this.transforms.delete(id);
  }
}
