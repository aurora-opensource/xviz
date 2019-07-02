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
import tape from 'tape-catch';

import {SensorPointCloud2} from '@xviz/ros';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

tape('SensorPointCloud2#basic', async t => {
  t.equals(SensorPointCloud2.name, 'SensorPointCloud2', 'Name is correct');
  t.equals(SensorPointCloud2.messageType, 'sensor_msgs/PointCloud2', 'Message Type is correct');

  const converter = new SensorPointCloud2({topic: '/points'});

  // In ros, this is usually on the '/tf' or '/tf_static' topic and
  // provides the transform from vehicle to sensor
  const frameIdToPoseMap = {
    velodyne: {
      x: 0,
      y: 0,
      z: 0,
      pitch: 0,
      roll: 0,
      yaw: 0
    }
  };

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder, {frameIdToPoseMap});

  // Add required /vehicle_pose
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.ok(metadata.streams['/points'], 'Has /points metadata');

  // This is a uint8 array of float values obtained from the cmd
  // xvizros bagdump --dumpMessages <bag> -t <topic>
  // which would work on any bag that contains this message type.
  const data = Uint8Array.from([0, 220, 13, 65, 128, 217, 150, 64, 0, 243, 138, 191, 0, 0, 64, 64]);
  const frame = {
    '/points': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          height: 1,
          width: 1,
          data
        }
      }
    ]
  };

  const builder = new XVIZBuilder();

  // Define required /vehicle_pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  t.ok(message.updates[0].primitives['/points'].points[0].points, 'Has points in XVIZ message');

  t.end();
});
