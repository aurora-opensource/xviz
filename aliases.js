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
const {resolve} = require('path');

module.exports = {
  'test-data': resolve(__dirname, 'test/data'),
  '@xviz/builder': resolve(__dirname, 'modules/builder/src'),
  '@xviz/cli': resolve(__dirname, 'modules/cli/src'),
  '@xviz/conformance': resolve(__dirname, 'modules/conformance'),
  '@xviz/io': resolve(__dirname, 'modules/io/src'),
  '@xviz/parser': resolve(__dirname, 'modules/parser/src'),
  '@xviz/ros': resolve(__dirname, 'modules/ros/src'),
  '@xviz/schema/dist': resolve(__dirname, 'modules/schema/dist'),
  '@xviz/schema': resolve(__dirname, 'modules/schema/src'),
  '@xviz/server': resolve(__dirname, 'modules/server/src')
};
