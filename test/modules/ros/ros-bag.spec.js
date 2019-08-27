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
import {TestBag, FooMsg, BarMsg} from './common';
import {DEFAULT_CONVERTERS, ROSConfig, ROS2XVIZConverter} from '@xviz/ros';

import {XVIZMetadataBuilder} from '@xviz/builder';

const bagData = {
  start_time: {sec: 1000, nsec: 0},
  end_time: {sec: 1010, nsec: 0},
  connections: {
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

const TestConverters = [BarMsg, FooMsg];

tape('ROSBag#empty rosConfig reads message types', async t => {
  const config = new ROSConfig();
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config, {
    logger: {verbose: m => console.log(m)}
  });

  const result = await bag.init(r2x);

  t.equals(result, true, 'Bag was correctly inited');
  t.equals(bag.bagContext.start_time, 1000, 'Bag startTime was correctly inited');
  t.equals(bag.bagContext.end_time, 1010, 'Bag was correctly inited');

  // Ensure we iterate /tf and /tf_static
  t.ok(bag.transforms.poseForTransformTo('base_link'), 'Has base_link transform');

  t.ok(bag.staticTransforms.poseForTransformTo('static_link'), 'Has static_link transform');

  // Ensure we go through the connections to get the topic types
  t.deepEquals(
    Object.keys(bag.topicMessageTypes).sort(),
    Object.values(bagData.connections)
      .map(c => c.topic)
      .sort(),
    'Gathered topics is correctly inited'
  );

  // Ensure we have 2 instances created
  t.equals(r2x.instances.length, 2, 'Gathered topics is correctly inited');
  t.end();
});

tape('ROSBag#populated rosConfig results in empty topicMessageTypes ', async t => {
  const config = new ROSConfig({
    topicConfig: [
      {
        topic: '/foo',
        type: 'foo_msg/Foo'
      },
      {
        topic: '/bar',
        type: 'bar_msg/Bar'
      }
    ]
  });
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config, {
    logger: {verbose: m => console.log(m)}
  });

  const result = await bag.init(r2x);

  t.equals(result, true, 'Bag was correctly inited');
  t.equals(bag.bagContext.start_time, 1000, 'Bag startTime was correctly inited');
  t.equals(bag.bagContext.end_time, 1010, 'Bag was correctly inited');

  // Ensure we iterate /tf and /tf_static
  t.ok(bag.transforms.poseForTransformTo('base_link'), 'Has base_link transform');

  t.ok(bag.staticTransforms.poseForTransformTo('static_link'), 'Has static_link transform');

  // Ensure topicMessageTypes was not populated
  t.deepEquals(Object.keys(bag.topicMessageTypes).length, 0, 'Gathered topics has length 0');

  // Ensure we have 2 instances created
  t.equals(r2x.instances.length, 2, 'Gathered topics is correctly inited');
  t.end();
});

tape('ROSBag#rosConfig with explicit Converter names', async t => {
  const config = new ROSConfig({
    topicConfig: [
      {
        topic: '/foo',
        converter: 'FooMsg'
      },
      {
        topic: '/bar',
        converter: 'BarMsg'
      }
    ]
  });
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config, {
    logger: {verbose: m => console.log(m)}
  });

  const result = await bag.init(r2x);

  t.equals(result, true, 'Bag was correctly inited');
  t.equals(bag.bagContext.start_time, 1000, 'Bag startTime was correctly inited');
  t.equals(bag.bagContext.end_time, 1010, 'Bag was correctly inited');

  // Ensure we iterate /tf and /tf_static
  t.ok(bag.transforms.poseForTransformTo('base_link'), 'Has base_link transform');

  t.ok(bag.staticTransforms.poseForTransformTo('static_link'), 'Has static_link transform');

  // Ensure topicMessageTypes was not populated
  t.deepEquals(Object.keys(bag.topicMessageTypes).length, 0, 'Gathered topics has length 0');

  // Ensure we have 2 instances created
  t.equals(r2x.instances.length, 2, 'Gathered topics is correctly inited');
  t.end();
});

tape('ROSBag#getMetadata', async t => {
  const config = new ROSConfig();
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config);

  const result = await bag.init(r2x);
  t.equals(result, true, 'Bag was correctly inited');

  const builder = new XVIZMetadataBuilder();
  bag.getMetadata(builder, r2x);
  const metadata = builder.getMetadata();
  t.ok(metadata.streams['/foo'], 'Metadata has "/foo" defined');
  t.ok(metadata.streams['/bar'], 'Metadata has "/bar" defined');

  t.end();
});

tape('ROSBag#readMessages w/no rosConfig has all topics', async t => {
  const config = new ROSConfig();
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config);

  const result = await bag.init(r2x);
  t.equals(result, true, 'Bag was correctly inited');

  const frame = await bag.readMessages();
  t.equals(Object.keys(frame).length, 4, 'frame has 4 keys');
  t.ok(frame['/foo'], 'readMessages returned "/foo"');
  t.ok(frame['/bar'], 'readMessages returned "/bar"');
  t.ok(frame['/tf'], 'readMessages returned "/tf"');
  t.ok(frame['/tf_static'], 'readMessages returned "/tf_static"');

  t.end();
});

tape('ROSBag#readMessages w/ rosConfig has limited topics', async t => {
  const config = new ROSConfig({
    topicConfig: [
      {
        topic: '/foo',
        type: 'foo_msg/Foo'
      },
      {
        topic: '/bar',
        type: 'bar_msg/Bar'
      }
    ]
  });
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config);

  const result = await bag.init(r2x);
  t.equals(result, true, 'Bag was correctly inited');

  const frame = await bag.readMessages();
  t.equals(Object.keys(frame).length, 3, 'frame has 3 keys');
  t.ok(frame['/foo'], 'readMessages returned "/foo"');
  t.ok(frame['/bar'], 'readMessages returned "/bar"');
  t.ok(frame['/tf'], 'readMessages returned added /tf');

  t.end();
});

tape('ROSBag#readMessages w/ start & end range', async t => {
  const config = new ROSConfig();
  const bag = new TestBag(null, config, {bagData});
  const r2x = new ROS2XVIZConverter(TestConverters, config);

  const result = await bag.init(r2x);
  t.equals(result, true, 'Bag was correctly inited');

  let frame = await bag.readMessages(1001, 1005);
  t.equals(Object.keys(frame).length, 1, 'frame has 1 keys');
  t.ok(frame['/foo'], 'readMessages returned "/foo"');

  frame = await bag.readMessages(1005, 1010);
  t.equals(Object.keys(frame).length, 1, 'frame has 4 keys');
  t.ok(frame['/bar'], 'readMessages returned "/bar"');

  t.end();
});
