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

import {parseVersionString} from '@xviz/parser/parsers/xviz-v2-common';

import tape from 'tape-catch';

function validateVersion(t, result, major, minor, patch) {
  t.equal(result.major, major, `major is ${major}`);
  t.equal(result.minor, minor, `minor is ${minor}`);
  t.equal(result.patch, patch, `patch is ${patch}`);
}

tape('XVIZ V2 Common#parseVersionString empty string', t => {
  const result = parseVersionString('');
  validateVersion(t, result, null, null, null);
  t.end();
});

tape('XVIZ V2 Common#parseVersionString valid strings', t => {
  let result = parseVersionString('1');
  validateVersion(t, result, 1, null, null);

  result = parseVersionString('1.2');
  validateVersion(t, result, 1, 2, null);

  result = parseVersionString('1.2.3');
  validateVersion(t, result, 1, 2, 3);

  result = parseVersionString('1.2.3-pre');
  validateVersion(t, result, 1, 2, 3);

  result = parseVersionString('.2.3');
  validateVersion(t, result, null, 2, 3);

  t.end();
});

tape(
  'XVIZ V2 Common#parseVersionString strings that should fail with proper semver validation',
  t => {
    let result = parseVersionString('-1');
    validateVersion(t, result, -1, null, null);

    result = parseVersionString('+1');
    validateVersion(t, result, 1, null, null);

    result = parseVersionString('.2.2');
    validateVersion(t, result, null, 2, 2);

    t.end();
  }
);

tape('XVIZ V2 Common#parseVersionString invalid strings', t => {
  let result = parseVersionString('^1');
  t.ok(Number.isNaN(result.major), `major is NaN`);

  result = parseVersionString('1-2-3');
  validateVersion(t, result, 1, null, null);

  t.end();
});
