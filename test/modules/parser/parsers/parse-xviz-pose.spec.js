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
import {setXVIZConfig} from '@xviz/parser';
import {parseXVIZPose} from '@xviz/parser/parsers/parse-xviz-pose';
import {resetXVIZConfigAndSettings} from '../config/config-utils';

import tape from 'tape-catch';

const testXVIZPose = {
  map_origin: {
    longitude: 8.422885,
    latitude: 49.0112128,
    altitude: 112.8349227
  },
  orientation: [0.0210803, -0.009091, -2.1248735],
  position: [20.6404841, -3317.4369679, 518.4297592],
  timestamp: 1172686281.40241
};

function parsedPoseCheck(t, parsedPose, xvizPose) {
  t.equal(parsedPose.x, xvizPose.position[0]);
  t.equal(parsedPose.y, xvizPose.position[1]);
  t.equal(parsedPose.z, xvizPose.position[2]);

  t.equal(parsedPose.roll, xvizPose.orientation[0]);
  t.equal(parsedPose.pitch, xvizPose.orientation[1]);
  t.equal(parsedPose.yaw, xvizPose.orientation[2]);

  t.equal(parsedPose.latitude, xvizPose.map_origin.latitude);
  t.equal(parsedPose.longitude, xvizPose.map_origin.longitude);
  t.equal(parsedPose.altitude, xvizPose.map_origin.altitude);
}

tape('parseXVIZPose#simple', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({DYNAMIC_STREAM_METADATA: true});

  const result = parseXVIZPose(testXVIZPose);
  parsedPoseCheck(t, result, testXVIZPose);

  t.is(result.__metadata.category, 'POSE', 'metadata generated');

  t.end();
});

tape('parseXVIZPose#additionalProperties preserved', t => {
  const additionalPropPose = {
    ...testXVIZPose,
    extraProp: true
  };

  const result = parseXVIZPose(additionalPropPose);
  parsedPoseCheck(t, result, additionalPropPose);
  t.equal(result.extraProp, true);
  t.end();
});
