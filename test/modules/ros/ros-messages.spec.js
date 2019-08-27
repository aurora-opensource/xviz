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
/* eslint-disable camelcase, no-unused-vars, no-loop-func */
import tape from 'tape-catch';
import {ROSMessageHandler, ROSMessages} from '@xviz/ros/core/ros-messages';
import {ROSTransforms} from '@xviz/ros/core/ros-transforms';

tape('ROSMessages#basic', t => {
  const rosMsgs = new ROSMessages();

  rosMsgs.add('/one', {msg: 1});
  rosMsgs.add('/one', {msg: 2});
  rosMsgs.add('/one', {msg: 3});
  rosMsgs.add('/two', {msg: 7});
  rosMsgs.add('/two', {msg: 8});

  t.equals(rosMsgs.topic('/one').length, 3, 'topic /one has 3 entries');
  t.equals(rosMsgs.topic('/two').length, 2, 'topic /two has 2 entries');

  t.end();
});

tape('ROSMessages#proxy basic', t => {
  const rosMsgs = new ROSMessages();

  rosMsgs.add('/one', {msg: 1});
  rosMsgs.add('/one', {msg: 2});
  rosMsgs.add('/one', {msg: 3});
  rosMsgs.add('/two', {msg: 7});
  rosMsgs.add('/two', {msg: 8});

  const proxyMsg = new Proxy(rosMsgs, ROSMessageHandler);
  t.equals(proxyMsg['/one'].length, 3, 'proxy topic /one has 3 entries');
  t.equals(proxyMsg['/two'].length, 2, 'proxy topic /two has 2 entries');

  t.end();
});

tape('ROSMessages#basic transform', t => {
  const transforms = new ROSTransforms();
  const tformMessage = {
    header: {
      stamp: {
        sec: 1295878707,
        nsec: 393324034
      },
      frame_id: 'world'
    },
    child_frame_id: 'base_link',
    transform: {
      translation: {
        x: 0.01,
        y: 0.02,
        z: 0.03
      },
      rotation: {
        x: 1.0,
        y: 0.0,
        z: 1.0,
        w: 0.0
      }
    }
  };
  const expectedTform = {
    x: 0.01,
    y: 0.02,
    z: 0.03,
    pitch: -Math.PI / 2,
    roll: Math.PI,
    yaw: Math.PI
  };
  transforms.addTransformMsg(tformMessage);

  const rosMsgs = new ROSMessages({transforms});

  const tforms = rosMsgs.transforms();
  t.ok(tforms, 'transforms exist');
  t.deepEquals(
    tforms.poseForTransformTo('base_link'),
    expectedTform,
    'base_link transform matches'
  );

  // Verify we can access methods through proxy
  const proxyMsg = new Proxy(rosMsgs, ROSMessageHandler);
  const proxyTform = proxyMsg.transforms();
  t.ok(proxyTform, 'proxy transforms exists');
  t.deepEquals(
    proxyTform.poseForTransformTo('base_link'),
    expectedTform,
    'base_link transform matches'
  );

  t.end();
});
