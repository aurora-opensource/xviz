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
/* eslint-disable camelcase */
import {serverArgs} from '@xviz/server';
import {registerROSBagProvider} from '@xviz/ros';

import {CustomImu} from './messages/custom-imu-converter';
import {CustomPointCloud} from './messages/imu-converter';

// -> is dynamic tf
// >> is static tf
// world -> base_link >> imu_link >> velo_link
//
// Normally we just use the IMU as the /vehicle_pose
// and convert data relative to it.
//
// With this example we use the world and do everything as
// meter offsets from that location. We loose the map integration
// but we could add it back if necessary by mapping current gps_fix
// which provides lng/lat and the inverse transform back to the world origin

// IMU will provide signal to generate world, base, imu coordinate origins
// and server as the vehicle pose.

// Setup ROS Provider
function setupROSProvider(args) {
  if (args.rosConfig) {
    registerROSBagProvider(args.rosConfig);
  }
}

function main() {
  const yargs = require('yargs');

  let args = yargs.alias('h', 'help');

  args = serverArgs(args, {defaultCommand: true});

  // This will parse and execute the server command
  args.middleware(setupROSProvider).parse();
}

main();
