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
const setupArgs = require('./args').setupArgs;

import {Log} from 'probe.gl';

import {XVIZServer} from './server/xviz-server';
import {XVIZProviderHandler} from './server/xviz-provider-handler';
import {XVIZProviderFactory} from '@xviz/io';

// For default command automatically support scenarios
import {ScenarioProvider} from './scenarios';
XVIZProviderFactory.addProviderClass(ScenarioProvider);

import {ROSBAGProvider} from '@xviz/ros';
XVIZProviderFactory.addProviderClass(ROSBAGProvider);

export function main() {
  const args = setupArgs();

  const log = new Log({id: 'xvizserver-log'});

  // Enable logging and set the level to the verbose count
  log.enable(true).setLevel(args.argv.v);

  const logger = {
    log: (...msg) => log.log(...msg)(),
    error: (...msg) => log.log(0, ...msg)(),
    warn: (...msg) => log.log(1, ...msg)(),
    info: (...msg) => log.log(1, ...msg)(),
    verbose: (...msg) => log.log(2, ...msg)()
  };

  const options = {
    ...args.argv,
    logger
  };

  if (Number.isFinite(args.argv.delay)) {
    options.delay = args.argv.delay;
  }

  const handler = new XVIZProviderHandler(XVIZProviderFactory, options);
  const wss = new XVIZServer([handler], options, () => {
    logger.log(`Listening on port ${wss.server.address().port}`);
  });
}
