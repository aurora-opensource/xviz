import XVIZBaseBuilder from './xviz-base-builder';
import XVIZPose from './xviz-pose';
import {CATEGORY} from './constant';

export default class XVIZPoseBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.pose
    });

    this._pose = null;
    this._poses = null;
  }

  timestamp(timestamp) {
    if (!this._pose) {
      this._pose = new XVIZPose();
    }
    this._pose.setTimestamp(timestamp);
    return this;
  }

  mapOrigin(longitude, latitude, altitude) {
    if (!this._pose) {
      this._pose = new XVIZPose();
    }
    this._pose.setMapOrigin(longitude, latitude, altitude);
    return this;
  }

  position(x, y, z) {
    if (!this._pose) {
      this._pose = new XVIZPose();
    }
    this._pose.setPosition(x, y, z);
    return this;
  }

  orientation(roll, pitch, yaw) {
    if (!this._pose) {
      this._pose = new XVIZPose();
    }
    this._pose.setOrientation(roll, pitch, yaw);
    return this;
  }

  flush() {
    super.flush();

    if (!this._poses) {
      this._poses = {};
    }

    this._poses[this.streamId] = this._pose.getData();
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
