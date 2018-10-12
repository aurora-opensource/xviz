import XVIZBaseBuilder from './xviz-base-builder';
import {CATEGORY} from './constant';

export default class XVIZPoseBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.pose
    });

    this._pose = {};
    this._poses = null;
  }

  timestamp(timestamp) {
    this._pose.timestamp = timestamp;
    return this;
  }

  mapOrigin(longitude, latitude, altitude) {
    this._pose.mapOrigin = [longitude, latitude, altitude];
    return this;
  }

  position(x, y, z) {
    this._pose.position = [x, y, z];
    return this;
  }

  orientation(roll, pitch, yaw) {
    this._pose.orientation = [roll, pitch, yaw];
    return this;
  }

  flush() {
    super.flush();

    if (!this._poses) {
      this._poses = {};
    }
    // TODO: validate we don't have an empty pose
    this._poses[this.streamId] = this._pose;
  }

  reset() {
    super.reset();

    this._pose = null;
  }

  getData() {
    if (this.streamId) {
      this.flush();
    }

    return {
      poses: this._poses
    };
  }
}
