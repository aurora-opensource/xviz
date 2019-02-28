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

const path = require('path');
const fs = require('fs');
const {loadJSONSync} = require('../scripts/file-utils');

import test from 'tape-catch';

const ROOT = path.resolve(__dirname, '..');

test('website#all-pages-present', t => {
  const pages = loadJSONSync(path.join(ROOT, 'website', 'pages.json'));

  const validate = input => {
    input.forEach(item => {
      if (item.markdown) {
        const fullpath = path.join(ROOT, 'docs', item.markdown);
        t.ok(fs.existsSync(fullpath), `Doc exists: item.markdown`);
      } else {
        validate(item.children);
      }
    });
  };

  validate(pages);

  t.end();
});
