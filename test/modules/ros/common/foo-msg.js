import {Converter} from '@xviz/ros';

export class FooMsg extends Converter {
  constructor(config) {
    super(config);
  }

  static get name() {
    return 'FooMsg';
  }

  static get messageType() {
    return 'foo_msg/Foo';
  }

  async convertMessage(frame, xvizBuilder) {
    xvizBuilder.primitive(this.xvizStream).circle([2, 0, 2], 4);
  }

  getMetadata(xvizMetaBuilder) {
    xvizMetaBuilder.stream(this.xvizStream);
  }
}
