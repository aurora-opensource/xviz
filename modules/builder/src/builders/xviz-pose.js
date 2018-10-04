export default class XVIZPose {
  constructor(props = {}) {
    this.timestamp = props.timestamp;

    this.mapOrigin = props.mapOrigin;
    this.position = props.position;
    this.orientation = props.orientation;
  }
}
