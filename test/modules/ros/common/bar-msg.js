import {Converter} from '@xviz/ros';

export class BarMsg extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'BarMsg';
  }

  static get messageType() {
    return 'bar_msg/Bar';
  }

  async convertMessage(frame, xvizBuilder) {
    xvizBuilder.primitive(this.xvizStream).circle([1, 0, 0], 2);
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder.stream(this.xvizStream);
  }
}
