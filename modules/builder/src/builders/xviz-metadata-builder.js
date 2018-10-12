// Note: XVIZ data structures use snake_case
/* eslint-disable camelcase*/
import {_Pose as Pose} from 'math.gl';

export default class XVIZMetadataBuilder {
  constructor() {
    this.data = {
      streams: {},
      styles: {}
    };

    this.stream_id = null;
    this.tmp_stream = {};
  }

  startTime(time) {
    this.data.start_time = time;
    return this;
  }

  endTime(time) {
    this.data.end_time = time;
    return this;
  }

  stream(stream_id) {
    if (this.stream_id) {
      this._flush();
    }

    this.stream_id = stream_id;
    return this;
  }

  category(cat) {
    this.tmp_stream.category = cat;
    return this;
  }

  type(t) {
    this.tmp_stream.type = t;
    return this;
  }

  unit(u) {
    this.tmp_stream.unit = u;
    return this;
  }

  coordinate(t) {
    this.tmp_stream.coordinate = t;
    return this;
  }

  pose({x = 0, y = 0, z = 0}, {roll = 0, pitch = 0, yaw = 0}) {
    const pose = new Pose({x, y, z, roll, pitch, yaw});
    this.tmp_pose_transform = pose.getTransformationMatrix();
    return this;
  }

  styleClassDefault(style) {
    this.styleClass('*', style);
    return this;
  }

  styleClass(className, style) {
    if (!this.data.styles[this.stream_id]) {
      this.data.styles[this.stream_id] = {
        [className]: style
      };
    } else {
      this.data.styles[this.stream_id][className] = style;
    }
    return this;
  }

  getMetadata() {
    this._flush();

    return {
      type: 'metadata',
      ...this.data
    };
  }

  _flush() {
    if (this.stream_id) {
      // todo: handle transform & pose reconcilation
      this.data.streams[this.stream_id] = this.tmp_stream;
    }

    this._reset();
  }

  _reset() {
    this.stream_id = null;
    this.tmp_stream = {};
  }
}
