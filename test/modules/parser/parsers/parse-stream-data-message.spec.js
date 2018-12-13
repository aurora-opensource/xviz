import {
  setXVIZConfig,
  getXVIZSettings,
  setXVIZSettings,
  parseStreamDataMessage,
  isEnvelope,
  unpackEnvelope,
  parseStreamLogData,
  LOG_STREAM_MESSAGE
} from '@xviz/parser';
import {XVIZValidator} from '@xviz/schema';

import tape from 'tape-catch';
import clone from 'clone';

import TestMetadataMessageV2 from 'test-data/sample-metadata-message';
import TestMetadataMessageV1 from 'test-data/sample-metadata-message-v1';
import TestFuturesMessageV1 from 'test-data/sample-frame-futures-v1';

import {resetXVIZConfigAndSettings} from '../config/config-utils';

const schemaValidator = new XVIZValidator();

// xviz data uses snake_case
/* eslint-disable camelcase */
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
          mapOrigin: {longitude: 11.2, latitude: 33.4, altitude: 55.6},
          position: [1.1, 2.2, 3.3],
          orientation: [0.1, 0.2, 0.3]
        }
      },
      variables: {},
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
              points: [[1000, 1000, 200]]
            }
          ]
        }
      }
    }
  ]
};

tape('isEnvelope', t => {
  t.ok(isEnvelope({type: 'foo', data: {a: 42}}), 'Detected XVIZ envelope');

  t.notok(isEnvelope(TestTimesliceMessageV1), 'V1 data not in envelope');

  t.notok(isEnvelope(TestTimesliceMessageV2), 'V2 data not in envelope');

  t.end();
});

tape('unpackEnvelope name parsing', t => {
  const notype = unpackEnvelope({type: 'foo', data: {a: 42}});
  t.equals('foo', notype.namespace);
  t.equals('', notype.type);

  const empty = unpackEnvelope({type: '', data: {a: 42}});
  t.equals('', empty.namespace);
  t.equals('', empty.type);

  t.end();
});

tape('unpackEnvelope xviz', t => {
  const enveloped = {
    type: 'xviz/state_update',
    data: {a: 42}
  };
  const expected = {
    namespace: 'xviz',
    type: 'state_update',
    data: enveloped.data
  };
  t.deepEquals(expected, unpackEnvelope(enveloped));

  t.end();
});

// TODO: blacklisted streams in xviz common
tape('parseStreamLogData metadata', t => {
  resetXVIZConfigAndSettings();

  const metaMessage = parseStreamLogData(TestMetadataMessageV2, {v2Type: 'metadata'});

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZSettings().currentMajorVersion,
    2,
    'Metadata currentMajorVersion set after parsing'
  );

  t.equals(
    metaMessage.eventStartTime,
    TestMetadataMessageV2.log_info.start_time,
    'Metadata eventStartTime set'
  );
  t.equals(
    metaMessage.eventEndTime,
    TestMetadataMessageV2.log_info.end_time,
    'Metadata eventEndTime set'
  );

  t.end();
});

tape('parseStreamLogData metadata v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [1]});

  const metaMessage = parseStreamLogData(TestMetadataMessageV1);

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZSettings().currentMajorVersion,
    1,
    'Metadata currentMajorVersion set after parsing'
  );

  t.equals(
    metaMessage.eventStartTime,
    TestMetadataMessageV2.log_info.start_time,
    'Metadata eventStartTime set'
  );
  t.equals(
    metaMessage.eventEndTime,
    TestMetadataMessageV2.log_info.end_time,
    'Metadata eventEndTime set'
  );

  t.end();
});

tape('parseStreamLogData unsupported version v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [2]});

  t.throws(
    () => parseStreamLogData(TestMetadataMessageV1),
    /XVIZ version 1 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseStreamLogData unsupported version v2', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [1]});

  t.throws(
    () => parseStreamLogData(TestMetadataMessageV2, {v2Type: 'metadata'}),
    /XVIZ version 2 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseStreamLogData undetectable version', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [2]});

  t.throws(
    () => parseStreamLogData({...TestMetadataMessageV2, version: 'abc'}, {v2Type: 'metadata'}),
    /Unable to detect the XVIZ version/,
    'Throws if version exists but cannot parse major version'
  );
  t.end();
});

tape('parseStreamLogData metadata with full log time only', t => {
  resetXVIZConfigAndSettings();

  const metaMessage = parseStreamLogData(metadataWithLogStartEnd, {v2Type: 'metadata'});

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZSettings().currentMajorVersion,
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

tape('parseStreamLogData validate test data', t => {
  schemaValidator.validate('session/state_update', TestTimesliceMessageV2);
  t.end();
});

tape('parseStreamLogData validate result when missing updates', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const metaMessage = parseStreamLogData(
    {
      update_type: 'snapshot'
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Type after parse set to error');
  t.ok(/Missing required/.test(metaMessage.message), 'Message details on what is missing');

  t.end();
});

tape('parseStreamLogData validate result when updates is empty', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const metaMessage = parseStreamLogData(
    {
      update_type: 'snapshot',
      updates: []
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Type after parse set to error');
  t.ok(/"updates" has length of 0/.test(metaMessage.message), 'Message details length is 0');

  t.end();
});

tape('parseStreamLogData validate result when missing timestamp in updates', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const metaMessage = parseStreamLogData(
    {
      update_type: 'snapshot',
      updates: [{}]
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Type after parse set to error');
  t.ok(
    /Missing timestamp in "updates"/.test(metaMessage.message),
    'Message details missing timestamp'
  );

  t.end();
});

tape('parseStreamLogData error', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const metaMessage = parseStreamLogData({message: 'my message'}, {v2Type: 'error'});
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.ERROR, 'Metadata type set to error');

  t.end();
});

tape('parseStreamLogData timeslice INCOMPLETE', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  // NOTE: no explicit type for this message yet.
  let metaMessage = parseStreamLogData(
    {
      ...TestTimesliceMessageV2,
      timestamp: null
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Missing timestamp is ok');

  metaMessage = parseStreamLogData(
    {
      ...TestTimesliceMessageV2,
      updates: [{updates: null}]
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing updates incomplete');

  metaMessage = parseStreamLogData(
    {
      ...TestTimesliceMessageV2,
      updates: [
        {
          poses: {
            '/vehicle_pose': {
              mapOrigin: {longitude: 11.2, latitude: 33.4, altitude: 55.6}
            }
          }
        }
      ]
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing updates is incomplete');

  metaMessage = parseStreamLogData(
    {
      ...TestTimesliceMessageV2,
      updates: [
        {
          timestamp: null
        }
      ]
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, LOG_STREAM_MESSAGE.INCOMPLETE, 'Missing timestamp is incomplete');

  t.end();
});

tape('parseStreamLogData timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseStreamLogData({...TestTimesliceMessageV2}, {v2Type: 'state_update'});
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
  resetXVIZConfigAndSettings();
  setXVIZConfig({PRIMARY_POSE_STREAM: '/vehicle_pose'});
  setXVIZSettings({currentMajorVersion: 1});

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
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 1});
  setXVIZConfig({
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

  t.end();
});

tape('parseStreamLogData pointCloud timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});
  const PointCloudTestTimesliceMessage = TestTimesliceMessageV2;

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

tape('parseStreamLogData polyline flat', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});
  const TestTimeslice = clone(TestTimesliceMessageV2);
  TestTimeslice.updates[0].primitives['/test/stream'] = {
    polylines: [
      {
        base: {
          object_id: '1234',
          style: {
            fill_color: [255, 255, 255]
          }
        },
        vertices: [1000, 1000, 200, 1000, 1000, 250]
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...TestTimeslice});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');

  const features = slice.streams['/test/stream'].features;
  t.equals(features.length, 1, 'has has object');
  t.equals(features[0].type, 'polyline', 'type is polyline');
  t.deepEquals(features[0].vertices, [[1000, 1000, 200], [1000, 1000, 250]], 'array is nested');

  t.end();
});

tape('parseStreamLogData polygon flat', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});
  const TestTimeslice = clone(TestTimesliceMessageV2);
  TestTimeslice.updates[0].primitives['/test/stream'] = {
    polygons: [
      {
        base: {
          object_id: '1234',
          style: {
            fill_color: [255, 255, 255]
          }
        },
        vertices: [1000, 1000, 200, 1000, 1000, 250, 1000, 1000, 300]
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...TestTimeslice});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');

  const features = slice.streams['/test/stream'].features;
  t.equals(features.length, 1, 'has has object');
  t.equals(features[0].type, 'polygon', 'type is polygon');
  t.deepEquals(
    features[0].vertices,
    // We automatically close loops...
    [[1000, 1000, 200], [1000, 1000, 250], [1000, 1000, 300], [1000, 1000, 200]],
    'array is nested and looped back'
  );

  t.end();
});

tape('parseStreamLogData flat JSON pointCloud', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});
  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  PointCloudTestTimesliceMessage.updates[0].primitives['/test/stream'].points.points = [
    1000,
    1000,
    200
  ];

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/stream'].pointCloud, 'has a point cloud');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.deepEquals(pointCloud.positions, [1000, 1000, 200], 'Has 3 values in positions');
  t.equals(pointCloud.colors.length, 4, 'Has 4 values in colors');

  t.end();
});

tape('parseStreamLogData pointCloud timeslice TypedArray', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  PointCloudTestTimesliceMessage.updates[0].primitives[
    '/test/stream'
  ].points.points = new Float32Array([1000, 1000, 200]);

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
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  PointCloudTestTimesliceMessage.updates[0].primitives['/test/stream'].points.push({
    object_id: '1235',
    base: {
      style: {
        fill_color: [255, 255, 255]
      }
    },
    points: new Float32Array([1000, 1000, 200])
  });

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

tape('parseStreamLogData variable timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});
  const VariableTestTimesliceMessage = {
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
        variables: {
          '/foo': {
            variables: [
              {
                base: {
                  object_id: 'A'
                },
                values: {doubles: [300, 400]}
              },
              {
                values: {doubles: [100, 200]}
              }
            ]
          }
        }
      }
    ]
  };

  // NOTE: no explicit type for this message yet.
  const slice = parseStreamLogData({...VariableTestTimesliceMessage});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/foo'].variable, 'has variable');

  const variable = slice.streams['/foo'].variable;
  t.equals(variable.length, 2, 'Has 2 instances');
  t.equals(variable[0].id, 'A', 'Has correct id');
  t.deepEquals(variable[0].values, [300, 400], 'Has correct values');

  t.end();
});

tape('parseStreamLogData futures timeslice v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 1});

  const slice = parseStreamLogData({...TestFuturesMessageV1});
  t.equals(slice.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/polygon'].lookAheads, 'has lookAheads field');

  const lookAheads = slice.streams['/test/polygon'].lookAheads;
  t.equals(lookAheads.length, 2, 'Has 2 primitive sets in lookAheads');

  t.end();
});

tape('parseStreamDataMessage', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  let result;
  let error;
  const opts = {};
  parseStreamDataMessage(
    {...TestTimesliceMessageV2},
    newResult => {
      result = newResult;
    },
    newError => {
      error = newError;
    },
    opts
  );

  t.equals(undefined, error, 'No errors received while parsing');
  t.equals(result.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    result.timestamp,
    TestTimesliceMessageV2.updates[0].poses['/vehicle_pose'].timestamp,
    'Message timestamp set from vehicle_pose'
  );

  t.end();
});

tape('parseStreamDataMessage enveloped', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const enveloped = {
    type: 'xviz/state_update',
    data: {...TestTimesliceMessageV2}
  };

  let result;
  let error;
  const opts = {};
  parseStreamDataMessage(
    enveloped,
    newResult => {
      result = newResult;
    },
    newError => {
      error = newError;
    },
    opts
  );

  t.equals(undefined, error, 'No errors received while parsing');
  t.equals(result.type, LOG_STREAM_MESSAGE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    result.timestamp,
    TestTimesliceMessageV2.updates[0].poses['/vehicle_pose'].timestamp,
    'Message timestamp set from vehicle_pose'
  );

  t.end();
});

tape('parseStreamDataMessage#enveloped#metadata', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const enveloped = {
    type: 'xviz/metadata',
    data: {version: '2.0.0'}
  };

  let result;
  let error;
  const opts = {};
  parseStreamDataMessage(
    enveloped,
    newResult => {
      result = newResult;
    },
    newError => {
      error = newError;
    },
    opts
  );

  t.equals(undefined, error, 'No errors received while parsing');
  t.notEquals(undefined, result, 'Update units');
  t.equals(result.type, LOG_STREAM_MESSAGE.METADATA, 'Message type set for metadata');
  t.equals(result.version, enveloped.data.version);

  t.end();
});

tape('parseStreamDataMessage#enveloped#transform_log_done', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const enveloped = {
    type: 'xviz/transform_log_done',
    data: {id: 'foo'}
  };

  let result;
  let error;
  const opts = {};
  parseStreamDataMessage(
    enveloped,
    newResult => {
      result = newResult;
    },
    newError => {
      error = newError;
    },
    opts
  );

  t.equals(undefined, error, 'No errors received while parsing');
  t.notEquals(undefined, result, 'Update units');
  t.equals(result.type, LOG_STREAM_MESSAGE.DONE, 'Message type set to done');
  t.equals(result.id, enveloped.data.id);

  t.end();
});

tape('parseStreamDataMessage enveloped not xviz', t => {
  resetXVIZConfigAndSettings();
  setXVIZSettings({currentMajorVersion: 2});

  const enveloped = {
    type: 'bar/foo',
    data: {a: 42}
  };

  let result;
  let error;
  const opts = {};
  parseStreamDataMessage(
    enveloped,
    newResult => {
      result = newResult;
    },
    newError => {
      error = newError;
    },
    opts
  );

  t.equals(undefined, error, 'No errors received while parsing');
  t.equals(undefined, result, 'No data parsed, unknown type');

  t.end();
});
