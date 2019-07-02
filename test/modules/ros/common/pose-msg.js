import {Converter} from '@xviz/ros';

export class PoseMsg extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'PoseMsg';
  }

  static get messageType() {
    return 'pose_msg/Pose';
  }

  async convertMessage(frame, xvizBuilder) {
    xvizBuilder
      .pose(this.xvizStream)
      .position(0, 0, 0)
      .timestamp(frame[this.topic][0].timestamp.sec);
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder.stream(this.xvizStream).category('pose');
  }
}
