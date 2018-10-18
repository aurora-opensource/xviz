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
const TestTimesliceMessageV1 = {
  timestamp: 1001.1,
  state_updates: [
    {
      variables: null,
      primitives: {
        '/test/stream': [
          {
            color: [255, 255, 255],
            id: 1234,
            radius: 0.01,
            type: 'points3d',
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

const TestTimesliceMessageV2 = {
  state_updates: [
    {
      timestamp: 1001.0,
      poses: {
        '/vehicle_pose': {
          timestamp: 1001.0,
          mapOrigin: [11.2, 33.4, 55.6],
          position: [1.1, 2.2, 3.3],
          orientation: [0.1, 0.2, 0.3]
        }
      },
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
  ]
};

// TODO: blacklisted streams in xviz common
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

tape('parseStreamLogData metadata v1', t => {
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
    ...TestTimesliceMessageV2,
    type: 'error'
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.ERROR, 'Metadata type set to error');
  t.end();
});

tape('parseStreamLogData timeslice INCOMPLETE', t => {
  setXvizConfig({});
  // NOTE: no explicit type for this message yet.
  let metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    timestamp: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Missing timestamp is ok');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    state_updates: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing state_updates incomplete');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    state_updates: [
      {
        poses: {
          '/vehicle_pose': {
            mapOrigin: [11.2, 33.4, 55.6]
          }
        }
      }
    ]
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing state_updates is incomplete');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    state_updates: [],
    timestamp: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing timestamp is incomplete');

  t.end();
});

tape('parseStreamLogData timeslice', t => {
  setXvizConfig({});
  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV2});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessageV2.state_updates[0].poses['/vehicle_pose'].timestamp,
    'Message timestamp set from vehicle_pose'
  );
  t.end();
});

tape('parseStreamLogData timeslice (metadata v1)', t => {
  setXvizConfig({version: 1, PRIMARY_POSE_STREAM: '/vehicle_pose'});
  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV1});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessageV1.vehicle_pose.time,
    'Message timestamp set from vehicle_pose'
  );
  t.end();
});

tape('parseStreamLogData pointCloud timeslice', t => {
  setXvizConfig({});
  const PointCloudTestTimesliceMessage = {
    state_updates: [
      {
        timestamp: 1001.0,
        poses: {
          '/vehicle_pose': {
            timestamp: 1001.0,
            mapOrigin: [11.2, 33.4, 55.6],
            position: [1.1, 2.2, 3.3],
            orientation: [0.1, 0.2, 0.3]
          }
        },
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
        poses: {
          '/vehicle_pose': {
            timestamp: 1001.0,
            mapOrigin: [11.2, 33.4, 55.6],
            position: [1.1, 2.2, 3.3],
            orientation: [0.1, 0.2, 0.3]
          }
        },
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
        poses: {
          '/vehicle_pose': {
            timestamp: 1001.0,
            mapOrigin: [11.2, 33.4, 55.6],
            position: [1.1, 2.2, 3.3],
            orientation: [0.1, 0.2, 0.3]
          }
        },
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
