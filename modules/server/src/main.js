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
import fs from 'fs';

import {Log} from 'probe.gl';

import {XVIZServer} from './server/xviz-server';
import {XVIZProviderHandler} from './server/xviz-provider-handler';
import {XVIZProviderFactory} from '@xviz/io';

// For default command automatically support scenarios
import {ScenarioProvider} from './scenarios';
import {ROSBAGProvider, ROS2XVIZFactory, defaultConverters} from '@xviz/ros';

// Class to make it easier to create a server with a custom provider
export class XVIZServerMain {
  setup() {
    this.args = setupArgs();

    this.log = new Log({id: 'xvizserver-log'});

    // Enable logging and set the level to the verbose count
    this.log.enable(true).setLevel(this.args.argv.v);

    this.logger = {
      log: (...msg) => this.log.log(...msg)(),
      error: (...msg) => this.log(0, ...msg)(),
      warn: (...msg) => this.log.log(1, ...msg)(),
      info: (...msg) => this.log.log(1, ...msg)(),
      verbose: (...msg) => this.log.log(2, ...msg)()
    };

    this.options = {
      ...this.args.argv,
      logger: this.logger
    };

    if (Number.isFinite(this.args.argv.delay)) {
      this.options.delay = this.args.argv.delay;
    }

    this.setupProviders();
  }

  // Default server will add Scenarios & ROSBAG support
  setupProviders() {
    XVIZProviderFactory.addProviderClass(ScenarioProvider);

    const {rosConfig} = this.options;

    let config = null;
    if (rosConfig) {
      // topicConfig: { keyTopic, topics }
      // mapping: [ { topic, name, config: {xvizStream, field} }, ... ]
      const data = fs.readFileSync(rosConfig);
      if (data) {
        config = JSON.parse(data);
      }
    }

    // Setup ROS support based on arguments
    const ros2xvizFactory = new ROS2XVIZFactory(defaultConverters);

    const rosbagProviderConfig = {
      ros2xvizFactory,
      ...config
    };
    XVIZProviderFactory.addProviderClass(ROSBAGProvider, rosbagProviderConfig);
  }

  execute() {
    this.setup();

    const handler = new XVIZProviderHandler(XVIZProviderFactory, this.options);
    const wss = new XVIZServer([handler], this.options, () => {
      this.logger.log(`Listening on port ${wss.server.address().port}`);
    });
  }
}

export function main() {
  const server = new XVIZServerMain();
  server.execute();
}
