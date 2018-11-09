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

import test from 'tape-catch';
import {XVIZUIBuilder} from '@xviz/builder';
import {XVIZValidator} from '@xviz/schema';

const schemaValidator = new XVIZValidator();

test('XvizBaseUIBuilder', t => {
  const builder = new XVIZUIBuilder({});

  const panel = builder.panel({name: 'Metrics Panel'});
  const container = builder.container({name: 'Metrics Container 1'});
  const metrics1 = builder.metric({
    streams: ['/vehicle/velocity'],
    title: 'Velocity'
  });
  const metrics2 = builder.metric({
    streams: ['/vehicle/acceleration'],
    title: 'Acceleration'
  });

  container.child(metrics1).child(metrics2);
  panel.child(container);
  builder.child(panel);

  const expected = {
    'Metrics Panel': {
      type: 'panel',
      children: [
        {
          type: 'container',
          children: [
            {
              type: 'metric',
              streams: ['/vehicle/velocity'],
              title: 'Velocity'
            },
            {
              type: 'metric',
              streams: ['/vehicle/acceleration'],
              title: 'Acceleration'
            }
          ],
          name: 'Metrics Container 1'
        }
      ],
      name: 'Metrics Panel'
    }
  };

  const actual = builder.getUI();

  t.deepEqual(actual, expected, 'XVIZUIBuilder should match expectation');

  for (const name in actual) {
    if (actual.hasOwnProperty(name)) {
      schemaValidator.validate('declarative-ui/panel', actual[name]);
    }
  }

  t.end();
});
