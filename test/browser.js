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

/* global window */
const test = require('tape');
const {_enableDOMLogging: enableDOMLogging} = require('@probe.gl/test-utils');

let failed = false;
test.onFinish(window.browserTestDriver_finish);
test.onFailure(() => {
  failed = true;
  window.browserTestDriver_fail();
});

// tap-browser-color alternative
enableDOMLogging({
  getStyle: message => ({
    background: failed ? '#F28E82' : '#8ECA6C',
    position: 'absolute',
    top: '220px',
    width: '100%'
  })
});

require('./modules/conformance');
require('./modules/builder');
require('./modules/parser');
require('./modules/schema');
require('./modules/io');
