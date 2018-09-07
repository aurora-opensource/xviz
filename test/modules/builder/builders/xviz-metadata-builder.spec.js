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

/* eslint-disable */
import test from 'tape-catch';
import {XVIZMetadataBuilder} from '@xviz/builder';

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

test('XVIZMetadataBuilder#default-ctor', t => {
  const xb = new XVIZMetadataBuilder();
  t.ok(xb, 'Created new XVIZMetadataBuilder');
  t.end();
});

test('XVIZMetadataBuilder#build', t => {
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0).endTime(1);

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    type: 'metadata',
    streams: {},
    styles: {},
    start_time: 0,
    end_time: 1
  };

  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build matches expected output');
  t.end();
});
