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
/* global console */
/* eslint-disable camelcase, no-unused-vars, no-loop-func, no-console */
import tape from 'tape-catch';
import {TestBag, FooMsg, BarMsg, PoseMsg} from './common';
import {DEFAULT_CONVERTERS, ROSConfig, ROSBagProvider, ROS2XVIZFactory} from '@xviz/ros';
import {XVIZData, XVIZProviderFactory} from '@xviz/io';

import {XVIZMetadataBuilder} from '@xviz/builder';

const bagData = {
  start_time: {sec: 1000, nsec: 0},
  end_time: {sec: 1010, nsec: 0},
  connections: {
    // We require a /vehicle_pose, so just put one in
    0: {
      topic: '/vehicle_pose',
      type: 'pose_msg/Pose'
    },
    1: {
      topic: '/foo',
      type: 'foo_msg/Foo'
    },
    2: {
      topic: '/bar',
      type: 'bar_msg/Bar'
    },
    3: {
      topic: '/tf',
      type: 'tf2_msgs/TFMessage'
    },
    4: {
      topic: '/tf_static',
      type: 'tf2_msgs/TFMessage'
    }
  },
  messages: [
    {
      topic: '/vehicle_pose',
      timestamp: {sec: 1000, nsec: 0},
      message: {}
    },
    {
      topic: '/foo',
      timestamp: {sec: 1002, nsec: 0},
      message: {}
    },
    {
      topic: '/bar',
      timestamp: {sec: 1008, nsec: 0},
      message: {}
    },
    {
      topic: '/tf',
      timestamp: {sec: 1000, nsec: 0},
      message: {
        transforms: [
          {
            child_frame_id: 'base_link',
            transform: {
              translation: {x: 0, y: 0, z: 0},
              rotation: {x: 0, y: 0, z: 0, w: 0}
            }
          }
        ]
      }
    },
    {
      topic: '/tf_static',
      timestamp: {sec: 1000, nsec: 0},
      message: {
        transforms: [
          {
            child_frame_id: 'static_link',
            transform: {
              translation: {x: 0, y: 0, z: 0},
              rotation: {x: 0, y: 0, z: 0, w: 0}
            }
          }
        ]
      }
    }
  ]
};

const TestConverters = [PoseMsg, BarMsg, FooMsg];

tape('ROSBagProvider#basic', async t => {
  const ros2xvizFactory = new ROS2XVIZFactory(TestConverters);

  const rosbagProviderConfig = {
    rosConfig: {},
    BagClass: TestBag,
    ros2xvizFactory,

    logger: {verbose: m => console.log(m)}
  };

  // config passed to Provider class
  XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);

  // {root, options}
  // options is passed as options to providerClass
  const provider = await XVIZProviderFactory.open({root: '', options: {bagData}});
  t.ok(provider, 'Provider was correctly created');

  const xvizData = provider.xvizMetadata();
  t.ok(xvizData, 'Provider metadata returned');

  const metadata = xvizData.message();
  t.ok(metadata.data.streams['/foo'], 'Metadata has "/foo" defined');
  t.ok(metadata.data.streams['/bar'], 'Metadata has "/bar" defined');

  t.end();
});

tape('ROSBagProvider#xvizMessage', async t => {
  const ros2xvizFactory = new ROS2XVIZFactory(TestConverters);

  const rosbagProviderConfig = {
    rosConfig: {},
    BagClass: TestBag,
    ros2xvizFactory,

    logger: {verbose: m => console.log(m)}
  };

  // config passed to Provider class
  XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);

  // {root, options}
  // options is passed as options to providerClass
  const provider = await XVIZProviderFactory.open({root: '', options: {bagData}});
  t.ok(provider, 'Provider was correctly created');

  const iterator = provider.getMessageIterator();
  t.ok(iterator, 'Provider iterator returned');

  const xvizData = await provider.xvizMessage(iterator);
  t.ok(xvizData.type, 'SNAPSHOT', 'XVIZ Message has SNAPSHOT type');

  const message = xvizData.message();
  t.deepEquals(
    Object.keys(message.data.updates[0].primitives).sort(),
    ['/bar', '/foo'],
    'Primitive streams are in the XVIZ message'
  );

  t.end();
});
