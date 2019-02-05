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

import {LogSynchronizer, setXVIZConfig} from '@xviz/parser';
import tape from 'tape-catch';

import {resetXVIZConfigAndSettings} from '../config/config-utils';

// xviz data uses snake_case
/* eslint-disable camelcase */

/* NOTE: keep in sync with tests in stream-synchronizer.spec.js */
const LOGS = {
  log1: [
    {attributes: {transmission_time: 100}, value: 1},
    {attributes: {transmission_time: 101}},
    {attributes: {transmission_time: 200}, value: 2},
    {attributes: {transmission_time: 300}, value: 3}
  ],
  log2: [
    {time: 50, value: 10},
    {time: 100, value: 20},
    {time: 101},
    {time: 250, value: 30},
    {time: 300.1, value: 40}
  ]
};

// Same as other log synchronizer test, keep in sync
const TEST_CASES = [
  {time: 0}, // out of range too early
  {time: 100, log1: 1, log2: 20}, // both in range
  {time: 102, log1: 'empty_entry', log2: 'empty_entry'}, // empty entry
  {time: 200, log1: 2}, // one in range
  {time: 3000}, // out of range too late
  {time: -1000}, // out of range way too early
  {time: 0}, // re-check
  {time: 300.1, log1: 3, log2: 40} // both in time window
];

tape('LogSynchronizer#constructor', t => {
  const logSynchronizer = new LogSynchronizer(LOGS);
  t.ok(logSynchronizer instanceof LogSynchronizer, 'Constructed');
  t.end();
});

tape('LogSynchronizer#setTime', t => {
  const logSynchronizer = new LogSynchronizer(LOGS);
  logSynchronizer.setTime(10);
  t.equals(logSynchronizer.getTime(), 10, 'Set and retrieved time');
  t.end();
});

tape('LogSynchronizer#getData', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});
  const logSynchronizer = new LogSynchronizer(LOGS);

  for (const tc of TEST_CASES) {
    const {time, log1, log2} = tc;
    logSynchronizer.setTime(time);
    const data = logSynchronizer.getLogSlice();
    t.comment(`Set time to ${time}`);
    if (log1) {
      if (log1 === 'empty_entry') {
        t.equals(data.streams.log1.value, undefined, 'Got correct empty entry for log1');
      } else {
        t.equals(data.streams.log1.value, log1, 'Got correct log1 value');
      }
    } else {
      t.equals(data.streams.log1, undefined, 'Got undefined log1 value');
    }

    if (log2) {
      if (log2 === 'empty_entry') {
        t.equals(data.streams.log2.value, undefined, 'Got correct empty entry for log2');
      } else {
        t.equals(data.streams.log2.value, log2, 'Got correct log2 value');
      }
    } else {
      t.equals(data.streams.log2, undefined, 'Got undefined log2 value');
    }
  }

  t.end();
});

tape('LogSynchronizer#correct lookup with empty entries (explicit no-data)', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});
  const LOGS_WITH_NO_DATA_ENTRIES = {
    stream1: [
      {attributes: {transmission_time: 90}},
      {attributes: {transmission_time: 100}, value: 1},
      {attributes: {transmission_time: 101}, value: 1.5},
      {attributes: {transmission_time: 103}},
      {attributes: {transmission_time: 110}, value: 2},
      {attributes: {transmission_time: 115}},
      {attributes: {transmission_time: 120}, value: 3}
    ],
    stream2: [
      {time: 90},
      {time: 102, value: 10},
      {time: 103},
      {time: 110, value: 20},
      {time: 115},
      {time: 121, value: 40},
      {time: 122}
    ]
  };

  const logSynchronizer = new LogSynchronizer(LOGS_WITH_NO_DATA_ENTRIES);

  // Test a time before any valid entries
  logSynchronizer.setTime(99);
  let data = logSynchronizer.getLogSlice();
  t.equals(data.streams.stream1, undefined, 'stream1 is undefined at time 99');
  t.equals(data.streams.stream2, undefined, 'stream2 is undefined at time 99');

  // Test with a valid entry for stream1 and no entry in the window for stream2
  logSynchronizer.setTime(100);
  data = logSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 1, 'stream1 is 1 at time 100');
  t.equals(data.streams.stream2, undefined, 'stream2 is undefined at time 100');

  // Test with a valid entry for both logs
  logSynchronizer.setTime(102);
  data = logSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 1.5, 'stream1 is 1.5 at time 102');
  t.equals(data.streams.stream2.value, 10, 'stream2 is 10 at time 102');

  // Test a time that has no-data entry for both streams
  logSynchronizer.setTime(103);
  data = logSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, undefined, 'stream1 is undefined at time 103');
  t.equals(data.streams.stream2.value, undefined, 'stream2 is undefined at time 103');

  // Test a time that has an entry for both
  logSynchronizer.setTime(110);
  data = logSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 2, 'stream1 is 2 at time 110');
  t.equals(data.streams.stream2.value, 20, 'stream2 is 20 at time 110');

  t.end();
});
