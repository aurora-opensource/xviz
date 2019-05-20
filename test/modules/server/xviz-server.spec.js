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
/* eslint-disable camelcase, no-unused-vars, no-loop-func */
import tape from 'tape-catch';

import {
  connect,
  makeXVIZData,
  TestClient,
  TestHandler,
  TestLogger,
  TestProvider,
  TestSession
} from './common-test-helpers';

import {
  XVIZProviderRequestHandler,
  XVIZSessionContext,
  XVIZServerMiddlewareStack,
  XVIZServer,
  XVIZWebsocketSender
} from '@xviz/server';

import {XVIZFormat} from '@xviz/io';

// Test this flow:
// Connect
// send start
// get metadata
// send transform_log
// get 2 state_updates
// get done
tape('XVIZServer#simple flow', t => {
  const testCase = {
    path: '/foo',
    params: {bar: '1'}
  };

  let wss = null;

  const logger = new TestLogger();

  const testSessionMaker = (socket, req) => {
    const context = new XVIZSessionContext();
    const provider = new TestProvider(makeXVIZData(100, 110));
    const middleware = new XVIZServerMiddlewareStack();
    const stack = [
      new XVIZProviderRequestHandler(context, provider, middleware, {logger}),
      new XVIZWebsocketSender(context, socket, {format: XVIZFormat.JSON_STRING})
    ];
    middleware.set(stack);

    return new TestSession(socket, middleware);
  };

  const handler = new TestHandler(testSessionMaker);
  wss = new XVIZServer([handler], {port: 0}, () => {
    const clientSocket = connect(
      wss,
      testCase
    );
    const sequence = [
      {
        expect: null,
        response: {
          type: 'xviz/start',
          data: {
            version: '2.0.0',
            log: 'foo'
          }
        }
      },
      {
        expect: msg => {
          t.equal(msg.type, 'metadata', 'received metadata');
        },
        response: {
          type: 'xviz/transform_log',
          data: {
            id: '1',
            start_timestamp: 100,
            end_timestamp: 101
          }
        }
      },
      {
        expect: msg => {
          t.equal(msg.type, 'state_update', 'received state_update');
          t.equal(msg.message().data.updates[0].timestamp, 100, 'received correct timestamp');
        }
      },
      {
        expect: msg => {
          t.equal(msg.type, 'state_update', 'received state_update');
          t.equal(msg.message().data.updates[0].timestamp, 101, 'received correct timestamp');
        }
      },
      {
        expect: msg => {
          t.equal(msg.type, 'transform_log_done', 'received done');
        }
      }
    ];

    const client = new TestClient(clientSocket, sequence, () => {
      t.equal(logger.count(), 5, 'logger is working');
      wss.close();
      t.end();
    });
  });
});
