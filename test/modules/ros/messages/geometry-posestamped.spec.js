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

import {GeometryPoseStamped} from '@xviz/ros';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

tape('GeometryPoseStamped#basic', async t => {
  t.equals(GeometryPoseStamped.name, 'GeometryPoseStamped', 'Name is correct');
  t.equals(GeometryPoseStamped.messageType, 'geometry_msgs/PoseStamped', 'Message Type is correct');

  const converter = new GeometryPoseStamped({topic: '/vehicle_pose'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  const metadata = metaBuilder.getMetadata();

  // Ensure we iterate /tf and /tf_static
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
    '/vehicle_pose': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          pose: {
            position: {
              x: 10.0,
              y: 70.0,
              z: 121.0
            },
            orientation: {
              x: 0.03,
              y: 0.01,
              z: -0.9,
              w: 0.07
            }
          }
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
            position: [10, 70, 0],
            orientation: [-0.013826774110473589, 0.05542837778801798, -2.94208948466124]
          }
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');

  t.end();
});
