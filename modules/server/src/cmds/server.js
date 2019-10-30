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
import {Log} from 'probe.gl';

import {XVIZServer} from '../server/xviz-server';
import {XVIZProviderHandler} from '../server/xviz-provider-handler';
import {XVIZProviderFactory} from '@xviz/io';

// For default command automatically support scenarios
import {ScenarioProvider} from '../scenarios';

export function serverArgs(inArgs, {defaultCommand = false} = {}) {
  const cmd = defaultCommand ? ['server', '*'] : 'server';

  return inArgs.command(
    cmd,
    'Start an XVIZ Server',
    {
      // client can request, otherwise default to source data format
      format: {
        describe: 'Output data format',
        choices: ['JSON_STRING', 'JSON_BUFFER', 'BINARY_GLB', 'BINARY_PBE'],
        nargs: 1
      },
      live: {
        describe: 'Return data as if from a live stream',
        boolean: true
      },
      delay: {
        describe: 'The delay between sending messages in milliseconds',
        type: 'number',
        default: 50
      },
      scenarios: {
        describe: 'Enable Scenario support',
        type: 'boolean',
        default: true,
        group: 'Scenario Options:'
      },
      duration: {
        describe: 'The duration in seconds of the generated scenario log',
        type: 'number',
        default: 30,
        group: 'Scenario Options:'
      },
      hz: {
        describe: 'The frequency of updates for a generated scenario log',
        type: 'number',
        default: 10,
        group: 'Scenario Options:'
      },
      directory: {
        alias: 'd',
        describe: 'Data directory source.  Multiple directories are supported',
        type: 'string',
        required: true,
        group: 'Hosting Options:'
      },
      port: {
        describe: 'Port to listen on',
        group: 'Hosting Options:'
      },
      verbose: {
        alias: 'v',
        count: true,
        describe: 'Logging level'
      }
    },
    serverCmd
  );
}

export function serverCmd(args) {
  const log = new Log({id: 'xvizserver-log'});

  // Enable logging and set the level to the verbose count
  log.enable(true).setLevel(args.v);

  const logger = {
    log: (...msg) => log.log(...msg)(),
    error: (...msg) => log(0, ...msg)(),
    warn: (...msg) => log.log(1, ...msg)(),
    info: (...msg) => log.log(1, ...msg)(),
    verbose: (...msg) => log.log(2, ...msg)()
  };

  const options = {
    ...args,
    logger
  };

  if (args.scenarios) {
    XVIZProviderFactory.addProviderClass(ScenarioProvider);
  }

  const handler = new XVIZProviderHandler(XVIZProviderFactory, options);
  const wss = new XVIZServer([handler], options, () => {
    logger.log(`Listening on port ${wss.server.address().port}`);
  });
}
