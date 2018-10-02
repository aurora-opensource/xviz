import {PRIMITIVE_STYLE_MAP} from './constant';

export default class XVIZValidator {
  constructor({validateError, validateWarn}) {
    this._validateWarn = validateWarn;
    this._validateError = validateError;
  }

  warn(msg) {
    this._validateWarn(msg);
  }

  error(msg) {
    this._validateError(msg);
  }

  hasProp(builder, prop, msg) {
    if (builder[prop]) {
      return;
    }

    const streamId = builder.getStreamId();
    this._validateWarn(msg || `Stream ${streamId}: ${prop} is missing.`);
  }

  propSetOnce(builder, prop, msg) {
    if (!this[prop]) {
      return;
    }
    if (this[prop] instanceof Array && this[prop].length === 0) {
      return;
    }

    const streamId = builder.getStreamId();
    this._validateWarn(msg || `Stream ${streamId}: ${prop} has been already set.`);
  }

  matchMetadata(builder) {
    const metadata = builder.getMetadata();
    const streamId = builder.getStreamId();
    const category = builder.getCategory();

    if (metadata && metadata.streams) {
      const streamMetadata = metadata.streams[streamId];
      if (!streamMetadata) {
        this._validateWarn(`${streamId} is not defined in metadata.`);
      } else if (category !== streamMetadata.category) {
        this._validateWarn(
          `Stream ${streamId} category '${category}' does not match metadata definition (${
            streamMetadata.category
          }).`
        );
      }
    }
  }

  validateStyle(builder) {
    const properties = Object.keys(builder._style);
    const validProperties = PRIMITIVE_STYLE_MAP[builder._type];
    if (validProperties) {
      const invalidProps = properties.filter(prop => !validProperties.includes(prop));
      if (invalidProps && invalidProps.length > 0) {
        this.warn(
          `Invalid style properties ${invalidProps.join(',')} for stream ${builder.streamId}`
        );
      }
    } else {
      this.warn(
        this,
        `Missing style validations for stream ${builder.streamId} with type ${builder._type}`
      );
    }
  }
}
