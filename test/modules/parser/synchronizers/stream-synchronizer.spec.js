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

import {StreamSynchronizer, XVIZStreamBuffer, setXVIZConfig} from '@xviz/parser';
import tape from 'tape-catch';
import {equals} from 'math.gl';

import {resetXVIZConfigAndSettings} from '../config/config-utils';

// xviz data uses snake_case
/* eslint-disable camelcase */

/* NOTE: keep in sync with tests in log-synchronizer.spec.js */
const TEST_BUFFER = new XVIZStreamBuffer();
TEST_BUFFER.timeslices = [
  {
    timestamp: 50,
    streams: {
      log1: {value: 1},
      log2: {value: 10}
    }
  },
  {
    timestamp: 100,
    streams: {
      log1: {value: 1},
      log2: {value: 20}
    }
  },
  {
    timestamp: 101,
    streams: {
      log1: {},
      log2: {}
    }
  },
  {
    timestamp: 200,
    streams: {
      log1: {value: 2}
    }
  },
  {
    timestamp: 250,
    streams: {
      log2: {value: 30}
    }
  },
  {
    timestamp: 300,
    streams: {
      log1: {value: 3}
    }
  },
  {
    timestamp: 300.1,
    streams: {
      log2: {value: 40}
    }
  }
];

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

tape('StreamSynchronizer#constructor', t => {
  const logSynchronizer = new StreamSynchronizer(TEST_BUFFER);
  t.ok(logSynchronizer instanceof StreamSynchronizer, 'Constructed');
  t.end();
});

tape('StreamSynchronizer#setTime', t => {
  const logSynchronizer = new StreamSynchronizer(TEST_BUFFER);
  logSynchronizer.setTime(10);
  t.equals(logSynchronizer.getTime(), 10, 'Set and retrieved time');
  t.end();
});

tape('StreamSynchronizer#getData', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});
  const logSynchronizer = new StreamSynchronizer(TEST_BUFFER);

  for (const tc of TEST_CASES) {
    const {time, log1, log2} = tc;
    logSynchronizer.setTime(time);
    t.comment(`Set time to ${time}`);
    const data = logSynchronizer.getLogSlice();
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

tape('StreamSynchronizer#getCurrentFrame', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});
  const streamSynchronizer = new StreamSynchronizer(TEST_BUFFER);

  streamSynchronizer.setTime(100);
  let frame = streamSynchronizer.getCurrentFrame();

  t.notOk(frame, 'frame is null if no vehicle pose');

  setXVIZConfig({ALLOW_MISSING_PRIMARY_POSE: true});
  frame = streamSynchronizer.getCurrentFrame();

  t.ok(frame, 'frame is generated without vehicle pose');
  t.deepEquals(
    frame.streams,
    {log1: {value: 1}, log2: {value: 20}},
    'frame contains correct streams'
  );
  t.ok(
    equals(frame.vehicleRelativeTransform, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    'vehicle relative transform is identity matrix'
  );

  t.end();
});

/* eslint-disable max-statements */
tape('StreamSynchronizer#correct lookup with empty entries (explicit no-data)', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});

  const STREAMS_WITH_NO_DATA_ENTRIES = new XVIZStreamBuffer();
  STREAMS_WITH_NO_DATA_ENTRIES.timeslices = [
    {
      // start both with no-data entry
      timestamp: 90,
      streams: {
        stream1: null,
        stream2: null
      }
    },
    {
      // stream1 has entry
      timestamp: 100,
      streams: {
        stream1: {value: 1}
      }
    },
    {
      // stream1 has a sequential value
      timestamp: 101,
      streams: {
        stream1: {value: 1.5}
      }
    },
    {
      // stream2 has a value
      timestamp: 102,
      streams: {
        stream2: {value: 10}
      }
    },
    {
      // add no-data entry for both
      timestamp: 103,
      streams: {
        stream1: null,
        stream2: null
      }
    },
    {
      // add entry for both
      timestamp: 110,
      streams: {
        stream1: {value: 2},
        stream2: {value: 20}
      }
    },
    {
      // no-data entry for both
      timestamp: 115,
      streams: {
        stream1: null,
        stream2: null
      }
    },
    {
      // last entry for stream1
      timestamp: 120,
      streams: {
        stream1: {value: 3}
      }
    },
    {
      // last entry for stream2
      timestamp: 121,
      streams: {
        stream2: {value: 40}
      }
    },
    {
      // empty entry for stream2
      timestamp: 122,
      streams: {
        stream2: null
      }
    }
  ];

  const streamSynchronizer = new StreamSynchronizer(STREAMS_WITH_NO_DATA_ENTRIES);

  // Test a time before any valid entries and with no entries within TIME_WINDOW
  streamSynchronizer.setTime(99);
  let data = streamSynchronizer.getLogSlice();
  t.equals(data.streams.stream1, undefined, 'stream1 is undefined at time 99');
  t.equals(data.streams.stream2, undefined, 'stream2 is undefined at time 99');

  // Test with a valid entry for stream1 and no entry in the window for stream2
  streamSynchronizer.setTime(100);
  data = streamSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 1, 'stream1 is 1 at time 100');
  t.equals(data.streams.stream2, undefined, 'stream2 is undefined at time 100');

  // Test with a valid entry for both logs
  streamSynchronizer.setTime(102);
  data = streamSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 1.5, 'stream1 is 1.5 at time 102');
  t.equals(data.streams.stream2.value, 10, 'stream2 is 10 at time 102');

  // Test a time that has no-data entry for both streams within the time-window
  streamSynchronizer.setTime(103);
  data = streamSynchronizer.getLogSlice();
  t.equals(data.streams.stream1, null, 'stream1 is explicitly no-data at time 103');
  t.equals(data.streams.stream2, null, 'stream2 is explicitly no-data at time 103');

  // Test a both streams picked up from same entry
  streamSynchronizer.setTime(110);
  data = streamSynchronizer.getLogSlice();
  t.equals(data.streams.stream1.value, 2, 'stream1 is 2 at time 110');
  t.equals(data.streams.stream2.value, 20, 'stream2 is 20 at time 110');

  t.end();
});

/* eslint-disable camelcase */
tape('StreamSynchronizer#getCurrentFrame links', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({TIME_WINDOW: 3});

  const testBuffer = new XVIZStreamBuffer();
  testBuffer.timeslices = [
    {
      timestamp: 50,
      streams: {
        log1: {value: 1},
        log2: {value: 10}
      },
      links: {
        log2: {
          target_pose: 'log1'
        }
      }
    }
  ];

  const streamSynchronizer = new StreamSynchronizer(testBuffer);

  streamSynchronizer.setTime(50);
  setXVIZConfig({ALLOW_MISSING_PRIMARY_POSE: true});
  const frame = streamSynchronizer.getCurrentFrame();

  t.ok(frame, 'frame is generated without vehicle pose');
  t.deepEquals(frame.links, {log2: {target_pose: 'log1'}}, 'frame contains correct links');

  t.end();
});
/* eslint-enable camelcase */
