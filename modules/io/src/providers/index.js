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
import {XVIZJSONProvider} from './xviz-json-provider';
import {XVIZBinaryProvider} from './xviz-binary-provider';

async function createXVIZProvider(ProviderClass, args) {
  let provider = null;
  provider = new ProviderClass(args);
  await provider.init();

  if (provider.valid()) {
    return provider;
  }

  return null;
}

export class XVIZProviderFactoryClass {
  constructor() {
    this.providerClasses = [XVIZJSONProvider, XVIZBinaryProvider];
  }

  addProviderClass(className) {
    this.providerClasses.push(className);
  }

  /*
   * Attempt to find a valid provider for the given source
   * returning null if none can be found.
   *
   * @param args.root
   * @param args.source
   * @param args.options
   */
  async open(args) {
    for (const providerClass of this.providerClasses) {
      const loader = await createXVIZProvider(providerClass, args);
      if (loader) {
        return loader;
      }
    }

    return null;
  }
}

export const XVIZProviderFactory = new XVIZProviderFactoryClass();
