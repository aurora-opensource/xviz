import test from 'tape';

import {XVIZBuilder} from '@xviz/builder';

const metadata = {
  type: 'metadata',
  streams: {
    'vehicle-pose': {
      category: 'vehicle-pose'
    },
    '/vehicle/acceleration': {
      category: 'time_series',
      type: 'float',
      unit: 'm/s^2'
    },
    '/vehicle/velocity': {
      category: 'time_series',
      type: 'float',
      unit: 'm/s'
    },
    '/vehicle/trajectory': {
      category: 'primitive',
      type: 'polyline'
    },
    '/lidar/points': {
      category: 'primitive',
      type: 'point'
    },
    '/tracklets/objects': {
      category: 'primitive',
      type: 'polygon'
    },
    '/tracklets/trajectory': {
      category: 'primitive',
      type: 'polyline'
    }
  }
};

test('XVIZBuilder#invalid-stream', t => {
  const xvizBuilder = new XVIZBuilder(metadata, {});
  const name = 'invalid-stream';
  t.throws(() => xvizBuilder.stream(name), Error, `Stream ${name} is not defined in metadata.`);
  t.end();
});

test('XVIZBuilder#no-stream-id', t => {
  const xvizBuilder = new XVIZBuilder(metadata, {});
  t.throws(() => xvizBuilder.timestamp(123), Error, 'Setup stream first');
  t.end();
});

test('XVIZBuilder#set-data-twice', t => {
  const xvizBuilder = new XVIZBuilder(metadata, {});
  t.throws(
    () =>
      xvizBuilder
        .stream('vehicle-pose')
        .value(123)
        .value(123),
    Error,
    'Stream already has data'
  );
  t.end();
});
