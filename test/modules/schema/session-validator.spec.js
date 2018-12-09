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

import {XVIZSessionValidator, MessageTypes} from '@xviz/schema';

import test from 'tape-catch';

const MINIMAL_STATE_UPDATE = {
  update_type: 'incremental', // eslint-disable-line camelcase
  updates: [
    {
      timestamp: 1001.3,
      primitives: {
        '/object/points': {
          points: [
            {
              points: [9, 15, 3, 20, 13, 3, 20, 5, 3]
            }
          ]
        }
      }
    }
  ]
};

// Test connect then close works OK (good counts, no errors)
test('sessionValidator#connect-then-close', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.close();

  const s = validator.stats;

  t.deepEqual({}, s.messages, 'no messages');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.equal(1, Object.keys(s.stateErrors).length, 'close after open is an error');
  t.end();
});

// Test that we find an invalid connect right to metadata issue
test('sessionValidator#connect-metadata', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.onMetadata({version: '2.0.0'});

  const s = validator.stats;

  const e = {};
  e[MessageTypes.METADATA] = 1;

  t.deepEqual(e, s.messages, 'got metadata');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.equal(1, Object.keys(s.stateErrors).length, 'metadata before start');
  t.end();
});

// Test connect start metadata close works OK (good counts, no errors)
test('sessionValidator#connect-metadata', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.onStart({version: '2.0.0'});
  validator.onMetadata({version: '2.0.0'});

  const s = validator.stats;

  const e = {};
  e[MessageTypes.METADATA] = 1;
  e[MessageTypes.START] = 1;

  t.deepEqual(s.messages, e, 'got all messages');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.deepEqual(s.stateErrors, {}, 'valid transitions');
  t.end();
});

// Test connect start metadata close works OK (good counts, no errors)
test('sessionValidator#connect-start-error', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.onStart({version: '3.0.0'});
  validator.onError({message: 'unsupported version'});

  const s = validator.stats;

  const e = {};
  e[MessageTypes.START] = 1;
  e[MessageTypes.ERROR] = 1;

  t.deepEqual(s.messages, e, 'got all messages');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.deepEqual(s.stateErrors, {}, 'valid transitions');
  t.end();
});

// Test connect start metadata close works OK (good counts, no errors)
test('sessionValidator#metadata-not-valid', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.onMetadata({version: '2.0.0', foo: 'bra'});

  const s = validator.stats;

  const e = {};
  e[MessageTypes.METADATA] = 1;
  t.deepEqual(e, s.validationErrors, 'invalid metadata');

  t.end();
});

// Test normal start, metadata, transform log, state update, transform log done
test('sessionValidator#connect-metadata', t => {
  // Creation == connect
  const validator = new XVIZSessionValidator();

  validator.onStart({version: '2.0.0'});
  validator.onMetadata({version: '2.0.0'});
  validator.onTransformLog({
    id: '9a71050b-4143-479e-8700-36ec2ed8670a'
  });
  validator.onStateUpdate(MINIMAL_STATE_UPDATE);
  validator.onStateUpdate(MINIMAL_STATE_UPDATE);
  validator.onTransformLogDone({
    id: '9a71050b-4143-479e-8700-36ec2ed8670a'
  });

  const s = validator.stats;

  const e = {};
  e[MessageTypes.METADATA] = 1;
  e[MessageTypes.START] = 1;
  e[MessageTypes.TRANSFORM_LOG] = 1;
  e[MessageTypes.STATE_UPDATE] = 2;
  e[MessageTypes.TRANSFORM_LOG_DONE] = 1;

  t.deepEqual(s.messages, e, 'got all messages');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.deepEqual(s.stateErrors, {}, 'valid transitions');
  t.end();
});

// Test a live session
test('sessionValidator#connect-metadata-live-data', t => {
  const validator = new XVIZSessionValidator();

  validator.onStart({
    version: '2.0.0',
    session_type: 'live' // eslint-disable-line camelcase
  });
  validator.onMetadata({version: '2.0.0'});
  validator.onStateUpdate(MINIMAL_STATE_UPDATE);
  validator.onStateUpdate(MINIMAL_STATE_UPDATE);

  const s = validator.stats;

  const e = {};
  e[MessageTypes.METADATA] = 1;
  e[MessageTypes.START] = 1;
  e[MessageTypes.STATE_UPDATE] = 2;

  t.deepEqual(s.messages, e, 'got all messages');
  t.deepEqual(s.validationErrors, {}, 'all valid');
  t.deepEqual(s.stateErrors, {}, 'valid transitions');
  t.end();
});

// TODO(jlisee): test wrong request ID returned in transform log
