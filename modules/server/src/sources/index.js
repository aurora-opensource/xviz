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
import {XVIZJSONDataSource} from './xviz-json-data-source';
import {XVIZBinaryDataSource} from './xviz-binary-data-source';
import {ROSBAGDataSource} from './rosbag-data-source';

async function createDataSource(SourceClass, args) {
  let source = null;
  source = new SourceClass(args);
  await source.init();

  if (source.valid()) {
    return source;
  }

  return null;
}

export class XVIZSourceFactory {
  // root
  // dataSource
  // options
  static async open(args) {
    const sourceClasses = [XVIZJSONDataSource, XVIZBinaryDataSource, ROSBAGDataSource];

    for (const sourceClass of sourceClasses) {
      const loader = await createDataSource(sourceClass, args);
      if (loader) {
        return loader;
      }
    }

    return null;
  }
}
