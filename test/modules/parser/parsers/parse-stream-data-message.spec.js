import {setXvizConfig, parseStreamLogData, LOG_STREAM_MESSAGE} from '@xviz/parser';

import tape from 'tape-catch';
import TestMetadataMessage from 'test-data/sample-metadata-message';

// xviz data uses snake_case
/* eslint-disable camelcase */

// Metadata missing normal start_time and end_time
// but with the full log timing fields
const metadataWithLogStartEnd = {
  type: 'metadata',
  log_start_time: 1194278450.6,
  log_end_time: 1194278451.6,
  streams: {},
  videos: {},
  map: {
    name: 'phx',
    entry_point: '6b9d0916d69943c9d88d2703e72021f5'
  }
};

// TODO replace with second message in stream
// NOTE: the timestamp in 'primtives' is not required to match that of 'vehicle_pose'
const TestTimesliceMessage = {
  timestamp: 1001.1,
  state_updates: [
    {
      timestamp: 1001.0,
      variables: null,
      primitives: {
        '/test/stream': [
          {
            color: [255, 255, 255],
            id: 1234,
            radius: 0.01,
            type: 'point',
            vertices: [[1000, 1000, 200]]
          }
        ]
      }
    }
  ],
  vehicle_pose: {
    continuous: {},
    map_relative: {
      map_index: 'should-be-a-guid'
    },
    time: 1001.2
  }
};

// TOOD: blacklisted streams in xviz common
//
tape('parseStreamLogData metadata', t => {
  setXvizConfig({});
  const metaMessage = parseStreamLogData(TestMetadataMessage);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');

  t.equals(
    metaMessage.eventStartTime,
    TestMetadataMessage.start_time,
    'Metadata eventStartTime set'
  );
  t.equals(metaMessage.eventEndTime, TestMetadataMessage.end_time, 'Metadata eventEndTime set');

  t.end();
});

tape('parseStreamLogData metadata with full log time only', t => {
  setXvizConfig({});
  const metaMessage = parseStreamLogData(metadataWithLogStartEnd);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');

  t.equals(
    metaMessage.logStartTime,
    metadataWithLogStartEnd.log_start_time,
    'Metadata logStartTime set'
  );
  t.equals(metaMessage.logEndTime, metadataWithLogStartEnd.log_end_time, 'Metadata logEndTime set');

  t.end();
});

tape('parseStreamLogData error', t => {
  setXvizConfig({});
  const metaMessage = parseStreamLogData({
    ...TestMetadataMessage,
    type: 'error'
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.ERROR, 'Metadata type set to error');
  t.end();
});

tape('parseStreamLogData timeslice INCOMPLETE', t => {
  setXvizConfig({});
  // NOTE: no explicit type for this message yet.
  let metaMessage = parseStreamLogData({
    ...TestTimesliceMessage,
    timestamp: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Missing timestamp is ok');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessage,
    state_updates: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Missing state_updates is ok');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessage,
    state_updates: [],
    timestamp: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing time is incomplete');

  t.end();
});

tape('parseStreamLogData timeslice', t => {
  setXvizConfig({});
  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessage});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessage.timestamp,
    'Message timestamp set from timeslice'
  );
  t.end();
});

tape('parseStreamLogData pointCloud timeslice', t => {
  setXvizConfig({});
  const PointCloudTestTimesliceMessage = {
    state_updates: [
      {
        timestamp: 1001.0,
        primitives: {
          '/test/stream': [
            {
              color: [255, 255, 255],
              id: 1234,
              radius: 0.01,
              type: 'point',
              vertices: [[1000, 1000, 200]]
            }
          ]
        }
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/stream'].pointCloud, 'has a point cloud');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.equals(pointCloud.positions.length, 3, 'Has 3 values in positions');
  t.equals(pointCloud.colors.length, 4, 'Has 4 values in colors');

  t.end();
});

tape('parseStreamLogData pointCloud timeslice TypedArray', t => {
  setXvizConfig({});
  const PointCloudTestTimesliceMessage = {
    state_updates: [
      {
        timestamp: 1001.0,
        primitives: {
          '/test/stream': [
            {
              color: [255, 255, 255],
              id: 1234,
              radius: 0.01,
              type: 'point',
              vertices: new Float32Array([1000, 1000, 200])
            }
          ]
        }
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/stream'].pointCloud, 'has a point cloud');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.equals(pointCloud.positions.length, 3, 'Has 3 values in positions');
  t.equals(pointCloud.colors.length, 4, 'Has 4 values in colors');

  t.end();
});

tape('parseStreamLogData pointCloud timeslice', t => {
  setXvizConfig({});
  const PointCloudTestTimesliceMessage = {
    state_updates: [
      {
        timestamp: 1001.0,
        primitives: {
          '/test/stream': [
            {
              color: [255, 255, 255],
              id: 1234,
              radius: 0.01,
              type: 'point',
              vertices: [[1000, 1000, 200]]
            },
            {
              color: [255, 255, 255],
              id: 1235,
              radius: 0.01,
              type: 'point',
              vertices: new Float32Array([1000, 1000, 200])
            }
          ]
        }
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/stream'].pointCloud, 'has a point cloud');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  t.equals(pointCloud.numInstances, 2, 'Has 2 instance');
  t.equals(pointCloud.positions.length, 6, 'Has 6 values in positions');
  t.equals(pointCloud.colors.length, 8, 'Has 8 values in colors');

  t.end();
});
