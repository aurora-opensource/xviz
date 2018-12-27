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

import {parseVehiclePose} from '@xviz/parser';
import {getTransformsFromPose} from '@xviz/parser/parsers/parse-vehicle-pose';

import tape from 'tape-catch';
import vehiclePose from 'test-data/sample-vehicle-pose';

tape('parseVehiclePose#import', t => {
  t.ok(parseVehiclePose, 'parseVehiclePose imported ok');

  const result = parseVehiclePose([vehiclePose]);
  t.ok(result);

  t.end();
});

tape('parseVehiclePose#getTransformsFromPose', t => {
  const result = getTransformsFromPose(vehiclePose);
  t.equals(result.origin, null, 'no mapOrigin present');
  t.deepEquals(result.trackPosition, [0, 0, 0], 'trackPosition');

  t.end();
});
