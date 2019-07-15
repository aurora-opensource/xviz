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

import {default as deepEqualsTolerance} from './deep-equals-tolerance';
import {diffString} from 'json-diff';

/**
 * Run a deep comparison on the given objects, returning a clear
 * unified diff style difference.  Helps highlight small changes in
 * large, nested, objects.
 * @param  {Tape}   t  Tape test object
 * @param  {Object} a  First object
 * @param  {Object} b  Second object, compared to the first
 */
export function diffDeepEquals(t, a, b, msg) {
  if (deepEqualsTolerance(a, b, msg)) {
    t.pass(msg);
  } else {
    const diff = diffString(a, b);
    t.fail(`Objects not equal: ${msg}: ${diff}`);
  }
}
