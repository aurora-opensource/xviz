export default class XVIZPose {
  constructor(props = {}) {
    this.timestamp = props.timestamp;

    this.mapOrigin = props.mapOrigin;
    this.position = props.position;
    this.orientation = props.orientation;
  }

  setMapOrigin(longitude, latitude, altitude) {
    this.mapOrigin = [longitude, latitude, altitude];
  }

  setPosition(x, y, z) {
    this.position = [x, y, z];
  }

  setOrientation(roll, pitch, yaw) {
    this.orientation = [roll, pitch, yaw];
  }

  setTimestamp(timestamp) {
    this.timestamp = timestamp;
  }

  getData() {
    const data = {};
    const {timestamp, mapOrigin, position, orientation} = this;

    if (timestamp) {
      data.timestamp = timestamp;
    }

    if (mapOrigin) {
      data.mapOrigin = mapOrigin;
    }

    if (position) {
      data.position = position;
    }

    if (orientation) {
      data.orientation = orientation;
    }

    return data;
  }
}
