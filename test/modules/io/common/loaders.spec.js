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
import tape from 'tape-catch';

import {parseBinaryXVIZ, XVIZBinaryWriter, XVIZProtobufWriter, MemorySourceSink} from '@xviz/io';
import {generateTestData} from './test-data-generator';

const TestData = new MemorySourceSink();
const pbeWriter = new XVIZProtobufWriter(TestData);
const glbWriter = new XVIZBinaryWriter(TestData);

// Generate test data using a builder for GLB & PBE
generateTestData(pbeWriter);
generateTestData(glbWriter);

// Verify the parsed data fields are accessible
// Specifically for PBE:
// - enums are string
// - metadata ui_config is an object per the spec
tape('parseBinaryXVIZ#metadata', t => {
  t.ok(TestData.has('1-frame.pbe'), 'PBE Metadata exists');
  t.ok(TestData.has('1-frame.glb'), 'GLB Metadata exists');

  const pbe = TestData.readSync('1-frame.pbe');
  const glb = TestData.readSync('1-frame.glb');

  const metaPBE = parseBinaryXVIZ(pbe);
  const metaGLB = parseBinaryXVIZ(glb);

  [metaPBE, metaGLB].forEach(meta => {
    t.equals('xviz/metadata', meta.type, 'Decoded type is correct');
    t.ok(meta.data.streams['/vehicle_pose'], 'Stream metadata present');
    t.equals(
      meta.data.streams['/vehicle_pose'].category,
      'POSE',
      'Stream metadata category is correct and a string'
    );
    t.equals(meta.data.ui_config.Metrics.name, 'Metrics', 'ui_config "Metrics" panel is present');
    t.equals(meta.data.log_info.start_time, 1000.1, 'Metadata start_time entry correct');
  });

  t.end();
});

tape('parseBinaryXVIZ#stateUpdate', t => {
  t.ok(TestData.has('2-frame.pbe'), 'PBE stateUpdate exists');
  t.ok(TestData.has('2-frame.glb'), 'GLB stateUpdate exists');

  const pbe = TestData.readSync('2-frame.pbe');
  const glb = TestData.readSync('2-frame.glb');

  const statePBE = parseBinaryXVIZ(pbe);
  const stateGLB = parseBinaryXVIZ(glb);

  [statePBE, stateGLB].forEach(meta => {
    t.equals('xviz/state_update', meta.type, 'Decoded type is correct');
    t.equals(meta.data.update_type, 'SNAPSHOT', 'Update Type is correct');
    t.ok(meta.data.updates[0].poses['/vehicle_pose'], 'Pose is present');
    t.equals(
      meta.data.updates[0].time_series[0].streams[0],
      '/vehicle/acceleration',
      'time_series data is present'
    );
    t.deepEquals(
      Array.from(meta.data.updates[0].primitives['/objects'].polygons[0].vertices),
      [1, 1, 1, 3, 3, 3, 4, 4, 4],
      'polygon vertices are correct'
    );
  });

  t.end();
});
