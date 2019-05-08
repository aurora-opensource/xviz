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
import {default as path} from 'path';

import {XVIZSessionHandler} from './xviz-session-handler';
// import {PreloadDataSource} from '../sources/preload-source';
import {FileSource} from '@xviz/io';

// Setup the source and return a SessionHandler or null
export class XVIZSession {
  constructor(factory, options) {
    this.factory = factory;
    this.options = options;
  }

  async newSession(socket, req) {
    let provider = null;

    const dirs = Array.isArray(this.options.d) ? this.options.d : [this.options.d];
    for (let i = 0; i < dirs.length; i++) {
      // Root is needed for some XVIZ sources
      const root = path.join(dirs[i], req.path);

      // FileSource is used for a JSON/GLB sources
      const source = new FileSource(root);

      provider = await this.factory.open({
        source,
        options: req.params,
        root
      });
      
      if (provider) {
        break;
      }
    }

    if (provider) {
      return new XVIZSessionHandler(socket, req, provider, this.options);
    }

    return null;
  }
}
