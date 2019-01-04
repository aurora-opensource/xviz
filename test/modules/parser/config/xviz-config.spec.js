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

import {setXVIZConfig, getXVIZConfig} from '@xviz/parser';
import {resetXVIZConfigAndSettings} from './config-utils';
import test from 'tape-catch';

test('setXVIZConfig', t => {
  const preProcessPrimitive = () => {};
  resetXVIZConfigAndSettings();

  setXVIZConfig({preProcessPrimitive});
  t.is(getXVIZConfig().preProcessPrimitive, preProcessPrimitive, 'XVIZ config is set');
  t.deepEquals(getXVIZConfig().supportedVersions, [1, 2], 'XVIZ default config is used');

  setXVIZConfig({supportedVersions: [1]});
  t.is(
    getXVIZConfig().preProcessPrimitive,
    preProcessPrimitive,
    'XVIZ config preProcessPrimitive is not changed'
  );
  t.deepEquals(getXVIZConfig().supportedVersions, [1], 'XVIZ config is set');

  setXVIZConfig({currentMajorVersion: 2});
  t.is(
    getXVIZConfig().preProcessPrimitive,
    preProcessPrimitive,
    'XVIZ config preProcessPrimitive is not changed'
  );

  t.is(getXVIZConfig().currentMajorVersion, 2, 'XVIZ config currentMajorVersion is set');

  t.end();
});
