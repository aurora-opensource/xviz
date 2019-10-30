import {XVIZBinaryReader} from './xviz-binary-reader';
import {XVIZJSONReader} from './xviz-json-reader';
import {XVIZProtobufReader} from './xviz-protobuf-reader';

export class XVIZReaderFactoryClass {
  constructor() {
    this.readerClasses = [
      {className: XVIZJSONReader},
      {className: XVIZBinaryReader},
      {className: XVIZProtobufReader}
    ];
  }

  addReaderClass(className, args) {
    this.readerClasses.push({className, args});
  }

  /*
   * Attempt to find a valid reader for the given source
   * returning null if none can be found.
   *
   * @param args.root
   * @param args.source
   * @param args.options
   */
  async open(args) {
    for (const providerEntry of this.providerClasses) {
      const options = {...args.options, ...providerEntry.args};
      const loader = await createXVIZProvider(providerEntry.className, {...args, options});

      if (loader) {
        return loader;
      }
    }

    return null;
  }
}
