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

// Set up a configuration (TODO/OSS - this should be a neutral config)
import '../src/loaders/test';

import './src/synchronizers/log-synchronizer.spec';
import './src/synchronizers/stream-synchronizer.spec';
import './src/synchronizers/xviz-stream-buffer.spec';

import './src/parsers/filter-vertices.spec';
import './src/parsers/parse-stream-data-message.spec';

import './src/styles/xviz-style-property.spec';
import './src/styles/xviz-style-parser.spec';

import './src/objects/xviz-object.spec';
import './src/objects/xviz-object-collection.spec';

import './src/utils/worker-utils.spec';
