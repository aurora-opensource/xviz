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

import {XVIZMiddlewareStack} from '@xviz/cli';

import test from 'tape-catch';

const NO_ARGS_METHODS = ['onConnect', 'onClose'];
const METHODS = [
  'onStart',
  'onError',
  'onMetadata',
  'onTransformLog',
  'onStateUpdate',
  'onTransformLogDone'
];

// This saves the result of calls and it's messages
class MyMiddleware {
  constructor(name, store) {
    this.name = name;
    this.store = store;

    NO_ARGS_METHODS.forEach(methodName => {
      this[methodName] = () => {
        this._storeCall(methodName);
      };
    });

    METHODS.forEach(methodName => {
      this[methodName] = msg => {
        this._storeCall(methodName, msg);
      };
    });
  }

  _storeCall(methodName, msg) {
    let callList = this.store[methodName];
    if (callList === undefined) {
      callList = [];
      this.store[methodName] = callList;
    }
    callList.push({name: this.name, msg});
  }
}

test('XVIZMiddlewareStack#noMiddleware', t => {
  invokeMiddleware([]);

  t.end();
});

test('XVIZMiddlewareStack#noMethods', t => {
  invokeMiddleware([{}]);

  t.end();
});

test('XVIZMiddlewareStack#stacked', t => {
  const results = {};
  const expected = {};

  // We expect foo to be called then bar
  NO_ARGS_METHODS.forEach(methodName => {
    const msg = undefined;
    expected[methodName] = [{name: 'foo', msg}, {name: 'bar', msg}];
  });

  METHODS.forEach(methodName => {
    const msg = {kind: methodName};
    expected[methodName] = [{name: 'foo', msg}, {name: 'bar', msg}];
  });

  // Invoke the middleware stack foo then bar
  const foo = new MyMiddleware('foo', results);
  const bar = new MyMiddleware('bar', results);

  invokeMiddleware([foo, bar]);

  t.deepEquals(expected, results, 'Callbacks executed');
  t.end();
});

function invokeMiddleware(stack) {
  const s = new XVIZMiddlewareStack(stack);

  NO_ARGS_METHODS.forEach(methodName => {
    s[methodName]();
  });

  METHODS.forEach(methodName => {
    s[methodName]({kind: methodName});
  });

  return s;
}
