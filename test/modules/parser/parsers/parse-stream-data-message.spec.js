import {
  setXvizConfig,
  getXvizSettings,
  setXvizSettings,
  parseStreamLogData,
  LOG_STREAM_MESSAGE
} from '@xviz/parser';

import tape from 'tape-catch';
import TestMetadataMessage from 'test-data/sample-metadata-message';
import TestMetadataMessageV1 from 'test-data/sample-metadata-message-v1';
import TestFuturesMessageV1 from 'test-data/sample-frame-futures-v1';

// xviz data uses snake_case
/* eslint-disable camelcase */

const defaultXvizSettings = getXvizSettings();

// Metadata missing normal start_time and end_time
// but with the full log timing fields
const metadataWithLogStartEnd = {
  version: '2.0.0',
  log_info: {
    log_start_time: 1194278450.6,
    log_end_time: 1194278451.6
  },
  streams: {},
  videos: {},
  map_info: {
    map: {
      name: 'phx',
      entry_point: '6b9d0916d69943c9d88d2703e72021f5'
    }
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
  update_type: 'snapshot',
  updates: [
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
        '/test/stream': {
          points: [
            {
              base: {
                object_id: '1234',
                style: {
                  fill_color: [255, 255, 255]
                }
              },
              radius: 0.01,
              points: [[1000, 1000, 200]]
            }
          ]
        }
      }
    }
  ]
};

// TODO: blacklisted streams in xviz common
tape('parseStreamLogData metadata', t => {
  setXvizConfig({});
  setXvizSettings(defaultXvizSettings);

  const metaMessage = parseStreamLogData(TestMetadataMessage);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXvizSettings().currentMajorVersion,
    2,
    'Metadata currentMajorVersion set after parsing'
  );

  t.equals(
    metaMessage.eventStartTime,
    TestMetadataMessage.log_info.start_time,
    'Metadata eventStartTime set'
  );
  t.equals(
    metaMessage.eventEndTime,
    TestMetadataMessage.log_info.end_time,
    'Metadata eventEndTime set'
  );

  t.end();
});

tape('parseStreamLogData metadata v1', t => {
  setXvizConfig({supportedVersions: [1]});
  setXvizSettings(defaultXvizSettings);

  const metaMessage = parseStreamLogData(TestMetadataMessageV1);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXvizSettings().currentMajorVersion,
    1,
    'Metadata currentMajorVersion set after parsing'
  );

  t.equals(
    metaMessage.eventStartTime,
    TestMetadataMessage.log_info.start_time,
    'Metadata eventStartTime set'
  );
  t.equals(
    metaMessage.eventEndTime,
    TestMetadataMessage.log_info.end_time,
    'Metadata eventEndTime set'
  );

  t.end();
});

tape('parseStreamLogData unsupported version v1', t => {
  setXvizConfig({supportedVersions: [2]});
  setXvizSettings(defaultXvizSettings);

  t.throws(
    () => parseStreamLogData(TestMetadataMessageV1),
    /XVIZ version 1 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseStreamLogData unsupported version v2', t => {
  setXvizConfig({supportedVersions: [1]});
  setXvizSettings(defaultXvizSettings);

  t.throws(
    () => parseStreamLogData(TestMetadataMessage),
    /XVIZ version 2 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseStreamLogData undetectable version', t => {
  setXvizConfig({supportedVersions: [2]});
  setXvizSettings(defaultXvizSettings);

  t.throws(
    () => parseStreamLogData({...TestMetadataMessage, version: 'abc'}),
    /XVIZ version is unable to be detected/,
    'Throws if version exists but cannot parse major version'
  );
  t.end();
});

tape('parseStreamLogData metadata with full log time only', t => {
  setXvizConfig({});
  setXvizSettings(defaultXvizSettings);

  const metaMessage = parseStreamLogData(metadataWithLogStartEnd);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXvizSettings().currentMajorVersion,
    2,
    'Metadata currentMajorVersion set after parsing'
  );

  t.equals(
    metaMessage.logStartTime,
    metadataWithLogStartEnd.log_info.log_start_time,
    'Metadata logStartTime set'
  );
  t.equals(
    metaMessage.logEndTime,
    metadataWithLogStartEnd.log_info.log_end_time,
    'Metadata logEndTime set'
  );

  t.end();
});

tape('parseStreamLogData error', t => {
  setXvizSettings({currentMajorVersion: 2});
  setXvizSettings(defaultXvizSettings);

  const metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    type: 'error'
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.ERROR, 'Metadata type set to error');

  t.end();
});

tape('parseStreamLogData timeslice INCOMPLETE', t => {
  setXvizSettings({currentMajorVersion: 2});
  setXvizSettings(defaultXvizSettings);

  // NOTE: no explicit type for this message yet.
  let metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    timestamp: null
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Missing timestamp is ok');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    updates: [{updates: null}]
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing updates incomplete');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    updates: [
      {
        poses: {
          '/vehicle_pose': {
            mapOrigin: [11.2, 33.4, 55.6]
          }
        }
      }
    ]
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing updates is incomplete');

  metaMessage = parseStreamLogData({
    ...TestTimesliceMessageV2,
    updates: [
      {
        timestamp: null
      }
    ]
  });
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing timestamp is incomplete');

  t.end();
});

tape('parseStreamLogData timeslice', t => {
  setXvizSettings({currentMajorVersion: 2});
  setXvizSettings(defaultXvizSettings);

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV2});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessageV2.updates[0].poses['/vehicle_pose'].timestamp,
    'Message timestamp set from vehicle_pose'
  );

  t.end();
});

tape('parseStreamLogData timeslice without parsing metadata (v1)', t => {
  // NOTE: this is the the teleassist case where they don't have metadata
  // before they start sending log data
  setXvizConfig({PRIMARY_POSE_STREAM: '/vehicle_pose'});
  setXvizSettings({currentMajorVersion: 1});

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV1});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessageV1.vehicle_pose.time,
    'Message timestamp set from timeslice'
  );
  t.notEqual(
    metaMessage.streams['/test/stream'].pointCloud,
    null,
    'v1 pointCloud is parsed even if metadata was not seen'
  );
  t.end();
});

tape('parseStreamLogData preProcessPrimitive type change', t => {
  let calledPreProcess = false;
  setXvizSettings({currentMajorVersion: 1});
  setXvizConfig({
    PRIMARY_POSE_STREAM: '/vehicle_pose',
    preProcessPrimitive: ({primitive, streamName, time}) => {
      calledPreProcess = true;
      primitive.type = 'circle2d';
    }
  });

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV1});

  t.ok(calledPreProcess, 'Called preProcessPrimitive callback');
  t.equals(
    metaMessage.streams['/test/stream'].pointCloud,
    null,
    'There are no pointClouds in parsed object'
  );

  // reset so preProcessPrimitive does not affect the subsequent tests.
  setXvizConfig({});
  t.end();
});

tape('parseStreamLogData pointCloud timeslice', t => {
  setXvizSettings({currentMajorVersion: 2});
  const PointCloudTestTimesliceMessage = {
    update_type: 'snapshot',
    updates: [
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
          '/test/stream': {
            points: [
              {
                base: {
                  object_id: 1234,
                  style: {
                    fill_color: [255, 255, 255]
                  }
                },
                radius: 0.01,
                points: [[1000, 1000, 200]]
              }
            ]
          }
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
  setXvizSettings({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = {
    update_type: 'snapshot',
    updates: [
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
          '/test/stream': {
            points: [
              {
                base: {
                  object_id: '1234',
                  style: {
                    fill_color: [255, 255, 255]
                  }
                },
                radius: 0.01,
                points: new Float32Array([1000, 1000, 200])
              }
            ]
          }
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
  setXvizSettings({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = {
    update_type: 'snapshot',
    updates: [
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
          '/test/stream': {
            points: [
              {
                object_id: '1234',
                base: {
                  style: {
                    fill_color: [255, 255, 255]
                  }
                },
                radius: 0.01,
                points: [[1000, 1000, 200]]
              },
              {
                object_id: '1235',
                base: {
                  style: {
                    fill_color: [255, 255, 255]
                  }
                },
                radius: 0.01,
                points: new Float32Array([1000, 1000, 200])
              }
            ]
          }
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

tape('parseStreamLogData futures timeslice v1', t => {
  setXvizConfig({});
  setXvizSettings({currentMajorVersion: 1});

  const slice = parseStreamLogData({...TestFuturesMessageV1});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/polygon'].lookAheads, 'has lookAheads field');

  const lookAheads = slice.streams['/test/polygon'].lookAheads;
  t.equals(lookAheads.length, 2, 'Has 2 primitive sets in lookAheads');

  t.end();
});
