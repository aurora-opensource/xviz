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

import {SensorNavSatFix} from '@xviz/ros';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

tape('SensorNavSatFix#basic', async t => {
  t.equals(SensorNavSatFix.name, 'SensorNavSatFix', 'Name is correct');
  t.equals(SensorNavSatFix.messageType, 'sensor_msgs/NavSatFix', 'Message Type is correct');

  // In this case the '/imu' can provide rotation information
  const converter = new SensorNavSatFix({topic: '/vehicle_pose', imuTopic: '/imu'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(
    metadata,
    {
      version: '2.0.0',
      streams: {
        '/vehicle_pose': {category: 'POSE'}
      }
    },
    'Metadata is correct'
  );

  const frame = {
    '/imu': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          orientation: {
            x: 0,
            y: 0,
            z: 0,
            w: 0
          }
        }
      }
    ],
    '/vehicle_pose': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          longitude: 120,
          latitude: 80,
          altitude: 0
        }
      }
    ]
  };

  const builder = new XVIZBuilder();
  converter.convertMessage(frame, builder);

  const message = builder.getMessage();
  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            map_origin: {
              longitude: 120,
              latitude: 80,
              altitude: 0
            },
            position: [0, 0, 0],
            // TODO(twojtasz): update to deps required this -0
            orientation: [0, -0, 0]
          }
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');

  t.end();
});
