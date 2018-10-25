// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
    if (!builder[prop]) {
      return;
    }
    if (builder[prop] instanceof Array && builder[prop].length === 0) {
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
    const streamId = builder.getStreamId();
    if (validProperties) {
      const invalidProps = properties.filter(prop => !validProperties.includes(prop));
      if (invalidProps && invalidProps.length > 0) {
        this.warn(`Invalid style properties ${invalidProps.join(',')} for stream ${streamId}`);
      }
    } else {
      this.warn(
        this,
        `Missing style validations for stream ${streamId} with type ${builder._type}`
      );
    }
  }
}
