import {StreamSynchronizer, XVIZStreamBuffer} from '@xviz/parser';
import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

const LOG_START_TIME = 0;
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
  {time: 200, log1: 2}, // one in range
  {time: 3000}, // out of range too late
  {time: -1000}, // out of range way too early
  {time: 0}, // re-check
  {time: 300.1, log1: 3, log2: 40} // both in time window
];

tape('StreamSynchronizer#constructor', t => {
  const logSynchronizer = new StreamSynchronizer(LOG_START_TIME, TEST_BUFFER);
  t.ok(logSynchronizer instanceof StreamSynchronizer, 'Constructed');
  t.end();
});

tape('StreamSynchronizer#setTime', t => {
  const logSynchronizer = new StreamSynchronizer(LOG_START_TIME, TEST_BUFFER);
  logSynchronizer.setTime(10);
  t.equals(logSynchronizer.getTime(), 10, 'Set and retrieved time');
  t.end();
});

tape('StreamSynchronizer#getData', t => {
  const logSynchronizer = new StreamSynchronizer(LOG_START_TIME, TEST_BUFFER);

  for (const tc of TEST_CASES) {
    const {time, log1, log2} = tc;
    logSynchronizer.setTime(time);
    t.comment(`Set time to ${time}`);
    const data = logSynchronizer.getLogSlice();
    if (log1) {
      t.equals(data.streams.log1.value, log1, 'Got correct log1 value');
    } else {
      t.equals(data.streams.log1, undefined, 'Got undefined log1 value');
    }

    if (log2) {
      t.equals(data.streams.log2.value, log2, 'Got correct log2 value');
    } else {
      t.equals(data.streams.log2, undefined, 'Got undefined log2 value');
    }
  }

  t.end();
});
