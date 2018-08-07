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

import {XvizStreamBuffer, STREAM_DATA_CONTENT} from 'xviz';

const TEST_TIMESLICES = [
  {
    id: 'TS-1',
    timestamp: 1002,
    channels: {A: 2, B: 0}
  },
  {
    id: 'TS-2',
    timestamp: 1001,
    channels: {A: 1, C: 1}
  },
  {
    id: 'TS-3',
    timestamp: 1005,
    channels: {A: 5}
  },
  {
    id: 'TS-4',
    timestamp: 1003,
    channels: {A: 3}
  },
  {
    id: 'TS-5',
    timestamp: 1004,
    channels: {A: 4, B: -1}
  },
  {
    id: 'TS-6',
    timestamp: 1001,
    channels: {A: 1.1}
  }
];

const TEST_TIMESLICES_SORTED = TEST_TIMESLICES.slice(0, 5).sort(
  (ts1, ts2) => ts1.timestamp - ts2.timestamp
);

test('XvizStreamBuffer#constructor', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  t.ok(xvizStreamBuffer instanceof XvizStreamBuffer, 'constructor does not throw error');
  t.not(xvizStreamBuffer.isLimited, 'buffer is unlimited');

  const xvizStreamBufferLimited = new XvizStreamBuffer({
    startOffset: -1,
    endOffset: 5
  });
  t.ok(xvizStreamBufferLimited instanceof XvizStreamBuffer, 'constructor does not throw error');
  t.ok(xvizStreamBufferLimited.isOffsetLimited, 'buffer is limited');

  t.throws(() => new XvizStreamBuffer({startOffset: 1, endOffset: 5}), 'validates parameters');

  t.end();
});

test('XvizStreamBuffer#getLoadedTimeRange', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  t.is(xvizStreamBuffer.getLoadedTimeRange(), null, 'returns null when buffer is empty');

  xvizStreamBuffer.timeslices = TEST_TIMESLICES_SORTED.slice();
  t.deepEquals(
    xvizStreamBuffer.getLoadedTimeRange(),
    {start: 1001, end: 1005},
    'returns correct buffer range'
  );

  t.end();
});

test('XvizStreamBuffer#getLoadedTimeRange - partial timeslices', t => {
  const testPartialTimeslices = [
    {timestamp: 1000.0, missingContentFlags: STREAM_DATA_CONTENT.VEHICLE},
    {timestamp: 1000.04, missingContentFlags: STREAM_DATA_CONTENT.XVIZ},
    {timestamp: 1000.1, missingContentFlags: STREAM_DATA_CONTENT.VEHICLE},
    {timestamp: 1000.14, missingContentFlags: STREAM_DATA_CONTENT.XVIZ},
    {timestamp: 1000.2, missingContentFlags: STREAM_DATA_CONTENT.VEHICLE},
    {timestamp: 1000.24, missingContentFlags: STREAM_DATA_CONTENT.XVIZ},
    {timestamp: 1000.3, missingContentFlags: STREAM_DATA_CONTENT.VEHICLE},
    {timestamp: 1000.34, missingContentFlags: STREAM_DATA_CONTENT.XVIZ}
  ];
  const testCases = [
    null,
    {start: 1000.04, end: 1000.04},
    {start: 1000.04, end: 1000.04},
    {start: 1000.04, end: 1000.14},
    {start: 1000.04, end: 1000.14},
    {start: 1000.04, end: 1000.24},
    {start: 1000.04, end: 1000.24},
    {start: 1000.04, end: 1000.34}
  ];

  const xvizStreamBuffer = new XvizStreamBuffer();

  testCases.forEach((result, i) => {
    xvizStreamBuffer.timeslices = testPartialTimeslices.slice(0, i + 1);
    t.deepEquals(xvizStreamBuffer.getLoadedTimeRange(), result, 'returns correct buffer range');
  });

  t.end();
});

test('XvizStreamBuffer#size, getTimeslices', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  t.is(xvizStreamBuffer.size, 0, 'returns correct size');

  xvizStreamBuffer.timeslices = TEST_TIMESLICES_SORTED.slice();
  t.is(xvizStreamBuffer.size, 5, 'returns correct size');

  let timeslices = xvizStreamBuffer.getTimeslices({start: 800, end: 900});
  t.is(timeslices.length, 0, 'returns correct timeslices');

  timeslices = xvizStreamBuffer.getTimeslices({start: 1000, end: 2000});
  t.is(timeslices.length, 5, 'returns correct timeslices');

  timeslices = xvizStreamBuffer.getTimeslices({start: 1000, end: 1004});
  t.is(timeslices.length, 4, 'returns correct timeslices');

  timeslices = xvizStreamBuffer.getTimeslices({start: 1006, end: 2000});
  t.is(timeslices.length, 0, 'returns correct timeslices');

  timeslices = xvizStreamBuffer.getTimeslices();
  t.is(timeslices.length, 5, 'returns correct timeslices');

  t.end();
});

test('XvizStreamBuffer#insert, getStreams', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  let timeslices;
  let {lastUpdate} = xvizStreamBuffer;

  TEST_TIMESLICES.forEach(sample => {
    xvizStreamBuffer.insert(sample);

    timeslices = xvizStreamBuffer.getTimeslices();

    const inserted = timeslices.find(timeslice => timeslice.timestamp === sample.timestamp);
    t.ok(inserted && inserted.id === sample.id, 'timeslice is inserted');

    t.not(lastUpdate, xvizStreamBuffer.lastUpdate, 'lastUpdate timestamp has changed');

    lastUpdate = xvizStreamBuffer.lastUpdate;

    let prevTimeslice = null;
    const isInOrder = timeslices.every(timeslice => {
      const inOrder = !prevTimeslice || prevTimeslice.timestamp < timeslice.timestamp;
      prevTimeslice = timeslice;
      return inOrder;
    });
    t.ok(isInOrder, 'timeslices are ordered by timestamp');
  });

  const ts1001 = timeslices.find(timeslice => timeslice.timestamp === 1001);
  t.deepEquals(ts1001.streams, {A: 1.1, C: 1}, 'streams are deep merged');
  t.deepEquals(
    xvizStreamBuffer.getStreams(),
    {A: [1.1, 2, 3, 4, 5], B: [-1], C: [1]},
    'getStreams returns correct result'
  );

  t.end();
});

test('XvizStreamBuffer#setCurrentTime', t => {
  let lastUpdate;

  const xvizStreamBufferNoLimit = new XvizStreamBuffer();
  xvizStreamBufferNoLimit.timeslices = TEST_TIMESLICES_SORTED.slice();

  lastUpdate = xvizStreamBufferNoLimit.lastUpdate;
  xvizStreamBufferNoLimit.setCurrentTime(1002);

  t.is(xvizStreamBufferNoLimit.size, 5, 'should not drop timeslices');
  t.is(lastUpdate, xvizStreamBufferNoLimit.lastUpdate, 'lastUpdate timestamp should not change');

  const xvizStreamBufferLimited = new XvizStreamBuffer({
    startOffset: -2,
    endOffset: 2
  });
  xvizStreamBufferLimited.timeslices = TEST_TIMESLICES_SORTED.slice(0, 4);

  xvizStreamBufferLimited.insert(TEST_TIMESLICES_SORTED[4]);
  t.is(xvizStreamBufferLimited.size, 5, 'should not drop timeslices if current time is not set');

  lastUpdate = xvizStreamBufferLimited.lastUpdate;
  xvizStreamBufferLimited.setCurrentTime(1002);

  t.is(xvizStreamBufferLimited.size, 4, 'drops timeslices out of buffer');
  t.deepEquals(
    xvizStreamBufferLimited.getLoadedTimeRange(),
    {start: 1001, end: 1004},
    'crops timeslices by buffer'
  );
  t.not(lastUpdate, xvizStreamBufferLimited.lastUpdate, 'lastUpdate timestamp has changed');

  xvizStreamBufferLimited.insert(TEST_TIMESLICES_SORTED[4]);
  t.is(xvizStreamBufferLimited.size, 4, 'should not insert timeslices out of buffer');

  t.end();
});

test('XvizStreamBuffer#hasBuffer', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();

  TEST_TIMESLICES.forEach(sample => xvizStreamBuffer.insert(sample));

  t.ok(xvizStreamBuffer.hasBuffer(1001, 1005), 'returns true for range covered by timeslice');
  t.end();
});

test('XvizStreamBuffer#updateFixedBuffer contraction, removes invalid data', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  xvizStreamBuffer.updateFixedBuffer(1000, 1010);
  TEST_TIMESLICES.forEach(sample => xvizStreamBuffer.insert(sample));
  const {start, end, oldStart, oldEnd} = xvizStreamBuffer.updateFixedBuffer(1002, 1003);

  t.is(start, 1002, 'contracts buffer start');
  t.is(end, 1003, 'contracts buffer end');
  t.is(oldStart, 1000, 'returns old buffer start');
  t.is(oldEnd, 1010, 'returns old buffer end');

  t.ok(xvizStreamBuffer.hasBuffer(1002, 1003), 'returns true for new range');
  t.ok(!xvizStreamBuffer.hasBuffer(1001, 1004), 'returns false for outside of range');
  t.ok(xvizStreamBuffer.isFixedLimited, 'buffer is limited');
  t.end();
});

test('XvizStreamBuffer#updateFixedBuffer uncapped expansion', t => {
  const xvizStreamBuffer = new XvizStreamBuffer();
  xvizStreamBuffer.updateFixedBuffer(1002, 1004);
  const {start, end, oldStart, oldEnd} = xvizStreamBuffer.updateFixedBuffer(1000, 1010);

  t.is(start, 1000, 'expands buffer start');
  t.is(end, 1010, 'expands buffer end');
  t.is(oldStart, 1002, 'returns old buffer start');
  t.is(oldEnd, 1004, 'returns old buffer end');
  t.ok(xvizStreamBuffer.isFixedLimited, 'buffer is limited');
  t.end();
});

test('XvizStreamBuffer#updateFixedBuffer small forward slides', t => {
  const xvizStreamBuffer = new XvizStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(990, 1004);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(1008, 1030);

  t.is(start, 1000, 'buffer start slides forward based on max length');
  t.is(end, 1030, 'buffer end uses provided');
  t.end();
});

test('XvizStreamBuffer#updateFixedBuffer large forward jumps', t => {
  const xvizStreamBuffer = new XvizStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(1000, 1004);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(1050, 1090);

  t.is(start, 1050, 'buffer start moved up');
  t.is(end, 1080, 'buffer end capped by max length');
  t.end();
});

test('XvizStreamBuffer#updateFixedBuffer large backwards jumps', t => {
  const xvizStreamBuffer = new XvizStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(1000, 1010);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(900, 920);

  t.is(start, 900, 'buffer start newly set');
  t.is(end, 920, 'buffer end newly set');
  t.end();
});
