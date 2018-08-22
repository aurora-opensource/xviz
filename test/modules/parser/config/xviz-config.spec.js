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

import {setXvizConfig, getXvizConfig} from '@xviz/parser';
import test from 'tape-catch';

test('setXvizConfig', t => {
  const postProcessFrame = () => {};
  setXvizConfig({postProcessFrame});
  t.is(getXvizConfig().postProcessFrame, postProcessFrame, 'XVIZ config is set');
  t.is(getXvizConfig().version, 2, 'XVIZ default config is used');
  t.notOk(getXvizConfig().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v2');

  setXvizConfig({version: 1});
  t.ok(getXvizConfig().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v1');

  t.end();
});
