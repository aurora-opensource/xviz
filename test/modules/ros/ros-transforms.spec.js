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
import {ROSTransformHandler, ROSTransforms} from '@xviz/ros/core/ros-transforms';

function makeTransform(child_frame_id, frame_id = 'world') {
  return {
    header: {
      stamp: {
        sec: 1295878707,
        nsec: 393324034
      },
      frame_id
    },
    child_frame_id,
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
}

const TRANSFORM_1 = makeTransform('base_link');
const EXPECTED_1 = {
  x: 0.01,
  y: 0.02,
  z: 0.03,
  pitch: -Math.PI / 2,
  roll: Math.PI,
  yaw: Math.PI
};

tape('ROSTransforms#basic', t => {
  const rosTforms = new ROSTransforms();
  rosTforms.addTransformMsg(TRANSFORM_1);

  t.deepEquals(
    rosTforms.poseForTransformTo('base_link'),
    EXPECTED_1,
    'base_link transform matches'
  );
  t.end();
});

tape('ROSTransforms#proxy basic', t => {
  const rosTforms = new ROSTransforms();
  rosTforms.addTransformMsg(TRANSFORM_1);

  const proxy = new Proxy(rosTforms, ROSTransformHandler);
  t.deepEquals(proxy['base_link'], EXPECTED_1, 'proxy base_link matches'); // eslint-disable-line   dot-notation

  t.end();
});

tape('ROSTransforms#staticTransform', t => {
  const staticTransforms = new ROSTransforms();
  staticTransforms.addTransformMsg(makeTransform('static_link'));

  const tforms = new ROSTransforms({staticTransforms});
  tforms.addTransformMsg(makeTransform('base_link', 'static_link'));

  // Verify static link
  const sform = tforms.transformMsgTo('static_link');
  t.ok(sform, 'static_link transform is returned');
  t.equals(sform.header.frame_id, 'world', 'static_link parent id is world');
  t.equals(sform.child_frame_id, 'static_link', 'child id is static_link');

  // Verify dynamic link
  const dform = tforms.transformMsgTo('base_link');
  t.ok(dform, 'base_link transform is returned');
  t.equals(dform.header.frame_id, 'static_link', 'base_link parent id is static_link');
  t.equals(dform.child_frame_id, 'base_link', 'child id is base_link');

  t.end();
});
