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

import {XVIZStreamBuffer} from '@xviz/parser';

const TEST_CASES = [
  {
    id: 'TS-1',
    message: {
      timestamp: 1002,
      streams: {A: 2, B: -3}
    },
    snapshot: {A: 2, B: -3}
  },
  {
    id: 'TS-2',
    message: {
      timestamp: 1001,
      streams: {A: 1, B: -2, C: 1}
    },
    snapshot: {A: 1, B: -2, C: 1}
  },
  {
    id: 'TS-3',
    message: {
      timestamp: 1005,
      streams: {A: 5}
    },
    snapshot: {A: 5}
  },
  {
    id: 'TS-4',
    message: {
      timestamp: 1003,
      streams: {A: 3}
    },
    snapshot: {A: 3}
  },
  {
    id: 'TS-5',
    message: {
      timestamp: 1004,
      streams: {A: 4, B: -1}
    },
    snapshot: {A: 4, B: -1}
  },
  {
    id: 'TS-6',
    message: {
      updateType: 'INCREMENTAL',
      timestamp: 1001,
      streams: {A: 1.1, B: null}
    },
    snapshot: {A: 1.1, B: null, C: 1}
  },
  {
    id: 'TS-8',
    message: {
      updateType: 'COMPLETE',
      timestamp: 1002,
      streams: {A: 2.2}
    },
    snapshot: {A: 2.2}
  }
];

const TEST_TIMESLICES_SORTED = TEST_CASES.slice(0, 5)
  .map(testCase => testCase.message)
  .sort((ts1, ts2) => ts1.timestamp - ts2.timestamp);

test('XVIZStreamBuffer#constructor', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
  t.ok(xvizStreamBuffer instanceof XVIZStreamBuffer, 'constructor does not throw error');
  t.not(xvizStreamBuffer.isLimited, 'buffer is unlimited');

  const xvizStreamBufferLimited = new XVIZStreamBuffer({
    startOffset: -1,
    endOffset: 5
  });
  t.ok(xvizStreamBufferLimited instanceof XVIZStreamBuffer, 'constructor does not throw error');
  t.is(xvizStreamBufferLimited.bufferType, 1, 'buffer is limited');

  t.throws(() => new XVIZStreamBuffer({startOffset: 1, endOffset: 5}), 'validates parameters');

  t.end();
});

test('XVIZStreamBuffer#getLoadedTimeRange', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
  t.is(xvizStreamBuffer.getLoadedTimeRange(), null, 'returns null when buffer is empty');

  xvizStreamBuffer.timeslices = TEST_TIMESLICES_SORTED.slice();
  t.deepEquals(
    xvizStreamBuffer.getLoadedTimeRange(),
    {start: 1001, end: 1005},
    'returns correct buffer range'
  );

  t.end();
});

test('XVIZStreamBuffer#size, getTimeslices', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
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

test('XVIZStreamBuffer#insert, getStreams', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
  let timeslices;
  let {lastUpdate} = xvizStreamBuffer;

  TEST_CASES.forEach(sample => {
    xvizStreamBuffer.insert(sample.message);

    timeslices = xvizStreamBuffer.getTimeslices();

    const inserted = timeslices.find(timeslice => timeslice.timestamp === sample.message.timestamp);
    t.deepEquals(inserted.streams, sample.snapshot, 'timeslice is inserted');

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

  t.deepEquals(
    xvizStreamBuffer.getStreams(),
    {A: [1.1, 2.2, 3, 4, 5], B: [null, -1], C: [1]},
    'getStreams returns correct result'
  );

  t.end();
});

test('XVIZStreamBuffer#setCurrentTime', t => {
  let lastUpdate;

  const xvizStreamBufferNoLimit = new XVIZStreamBuffer();
  xvizStreamBufferNoLimit.timeslices = TEST_TIMESLICES_SORTED.slice();

  lastUpdate = xvizStreamBufferNoLimit.lastUpdate;
  xvizStreamBufferNoLimit.setCurrentTime(1002);

  t.is(xvizStreamBufferNoLimit.size, 5, 'should not drop timeslices');
  t.is(lastUpdate, xvizStreamBufferNoLimit.lastUpdate, 'lastUpdate timestamp should not change');

  const xvizStreamBufferLimited = new XVIZStreamBuffer({
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

test('XVIZStreamBuffer#hasBuffer', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();

  TEST_CASES.forEach(sample => xvizStreamBuffer.insert(sample.message));

  t.ok(xvizStreamBuffer.hasBuffer(1001, 1005), 'returns true for range covered by timeslice');
  t.end();
});

test('XVIZStreamBuffer#updateFixedBuffer contraction, removes invalid data', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
  xvizStreamBuffer.updateFixedBuffer(1000, 1010);
  TEST_CASES.forEach(sample => xvizStreamBuffer.insert(sample.message));
  const {start, end, oldStart, oldEnd} = xvizStreamBuffer.updateFixedBuffer(1002, 1003);

  t.is(start, 1002, 'contracts buffer start');
  t.is(end, 1003, 'contracts buffer end');
  t.is(oldStart, 1000, 'returns old buffer start');
  t.is(oldEnd, 1010, 'returns old buffer end');

  t.ok(xvizStreamBuffer.hasBuffer(1002, 1003), 'returns true for new range');
  t.ok(!xvizStreamBuffer.hasBuffer(1001, 1004), 'returns false for outside of range');
  t.is(xvizStreamBuffer.bufferType, 2, 'buffer is limited');
  t.end();
});

test('XVIZStreamBuffer#updateFixedBuffer uncapped expansion', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer();
  xvizStreamBuffer.updateFixedBuffer(1002, 1004);
  const {start, end, oldStart, oldEnd} = xvizStreamBuffer.updateFixedBuffer(1000, 1010);

  t.is(start, 1000, 'expands buffer start');
  t.is(end, 1010, 'expands buffer end');
  t.is(oldStart, 1002, 'returns old buffer start');
  t.is(oldEnd, 1004, 'returns old buffer end');
  t.is(xvizStreamBuffer.bufferType, 2, 'buffer is limited');
  t.end();
});

test('XVIZStreamBuffer#updateFixedBuffer small forward slides', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(990, 1004);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(1008, 1030);

  t.is(start, 1000, 'buffer start slides forward based on max length');
  t.is(end, 1030, 'buffer end uses provided');
  t.end();
});

test('XVIZStreamBuffer#updateFixedBuffer large forward jumps', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(1000, 1004);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(1050, 1090);

  t.is(start, 1050, 'buffer start moved up');
  t.is(end, 1080, 'buffer end capped by max length');
  t.end();
});

test('XVIZStreamBuffer#updateFixedBuffer large backwards jumps', t => {
  const xvizStreamBuffer = new XVIZStreamBuffer({maxLength: 30});
  xvizStreamBuffer.updateFixedBuffer(1000, 1010);
  const {start, end} = xvizStreamBuffer.updateFixedBuffer(900, 920);

  t.is(start, 900, 'buffer start newly set');
  t.is(end, 920, 'buffer end newly set');
  t.end();
});

test('XVIZStreamBuffer#insert#PERSISTENT', t => {
  const testCases = [
    {
      title: 'insert - before time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 0,
        streams: {X: 10, Y: 20}
      },
      expect: {A: 5, X: 10, Y: 20}
    },
    {
      title: 'insert - after time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 1100,
        streams: {X: 100}
      },
      expect: {A: 5, X: 10, Y: 20}
    },
    {
      title: 'insert - before time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 900,
        streams: {X: 20, Y: 30, Z: -1}
      },
      expect: {A: 5, X: 20, Y: 30, Z: -1}
    },
    {
      title: 'merge',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 900,
        streams: {Y: null}
      },
      expect: {A: 5, X: 20, Y: 20, Z: -1}
    }
  ];

  const xvizStreamBuffer = new XVIZStreamBuffer();
  xvizStreamBuffer.insert({
    timestamp: 1000,
    streams: {A: 5}
  });

  for (const testCase of testCases) {
    const {lastUpdate} = xvizStreamBuffer;
    t.ok(xvizStreamBuffer.insert(testCase.message), 'persistent timeslice inserted');
    t.ok(xvizStreamBuffer.lastUpdate > lastUpdate, 'update counter updated');

    const timeslices = xvizStreamBuffer.getTimeslices({start: 1000, end: 1001});
    const streams = {};
    timeslices.forEach(timeslice => {
      for (const streamName in timeslice.streams) {
        streams[streamName] = timeslice.streams[streamName] || streams[streamName];
      }
    });
    t.deepEqual(streams, testCase.expect, `${testCase.title}: returns correct streams`);
  }

  t.end();
});

/* eslint-disable camelcase */
test('XVIZStreamBuffer#insert#links', t => {
  const testCases = [
    {
      title: 'insert - before time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 0,
        streams: {X: 10, Y: 20},
        links: {Y: {target_pose: 'X'}}
      },
      expect: {
        streams: {A: 5, X: 10, Y: 20},
        links: {Y: {target_pose: 'X'}}
      }
    },
    {
      title: 'insert - after time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 1100,
        streams: {X: 100},
        links: {Y: {target_pose: 'A'}}
      },
      expect: {
        streams: {A: 5, X: 10, Y: 20},
        links: {Y: {target_pose: 'X'}}
      }
    },
    {
      title: 'insert - before time window',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 900,
        streams: {X: 20, Y: 30, Z: -1},
        links: {Y: {target_pose: 'Z'}}
      },
      expect: {
        streams: {A: 5, X: 20, Y: 30, Z: -1},
        links: {Y: {target_pose: 'Z'}}
      }
    },
    {
      title: 'merge',
      message: {
        updateType: 'PERSISTENT',
        timestamp: 900,
        streams: {Y: null},
        links: {A: {target_pose: 'Z'}}
      },
      expect: {
        streams: {A: 5, X: 20, Y: 20, Z: -1},
        links: {
          Y: {target_pose: 'Z'},
          A: {target_pose: 'Z'}
        }
      }
    }
  ];

  const xvizStreamBuffer = new XVIZStreamBuffer();
  xvizStreamBuffer.insert({
    timestamp: 1000,
    streams: {A: 5}
  });

  for (const testCase of testCases) {
    const {lastUpdate} = xvizStreamBuffer;
    t.ok(xvizStreamBuffer.insert(testCase.message), 'persistent timeslice inserted');
    t.ok(xvizStreamBuffer.lastUpdate > lastUpdate, 'update counter updated');

    const timeslices = xvizStreamBuffer.getTimeslices({start: 1000, end: 1001});
    const streams = {};
    const links = {};
    timeslices.forEach(timeslice => {
      for (const streamName in timeslice.streams) {
        streams[streamName] = timeslice.streams[streamName] || streams[streamName];
      }
      for (const streamName in timeslice.links) {
        links[streamName] = timeslice.links[streamName] || links[streamName];
      }
    });
    t.deepEqual(streams, testCase.expect.streams, `${testCase.title}: returns correct streams`);
    t.deepEqual(links, testCase.expect.links, `${testCase.title}: returns correct links`);
  }

  t.end();
});
/* eslint-enable camelcase */
