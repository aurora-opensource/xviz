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
/* eslint-disable max-statements */
import {
  setXVIZConfig,
  getXVIZConfig,
  parseXVIZMessageSync,
  isEnvelope,
  isXVIZMessage,
  getXVIZMessageType,
  getDataFormat,
  unpackEnvelope,
  parseXVIZData,
  XVIZ_MESSAGE_TYPE
} from '@xviz/parser';
import {XVIZValidator} from '@xviz/schema';

import tape from 'tape-catch';
import clone from 'clone';

import TestMetadataMessageV2 from 'test-data/sample-metadata-message';
import TestMetadataMessageV1 from 'test-data/sample-metadata-message-v1';
import TestFuturesMessageV1 from 'test-data/sample-frame-futures-v1';

import MinimalBinaryMetadata from 'test-data/minimal-metadata';
import MinimalBinaryStateUpdate from 'test-data/minimal-state-update';

import {resetXVIZConfigAndSettings} from '../config/config-utils';
import {TextEncoder} from '@xviz/parser/utils/text-encoding';

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
  update_type: 'COMPLETE_STATE',
  updates: [
    {
      timestamp: 1001.0,
      poses: {
        '/vehicle_pose': {
          timestamp: 1001.0,
          map_origin: {longitude: 11.2, latitude: 33.4, altitude: 55.6},
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
  t.equals(notype.namespace, 'foo');
  t.equals(notype.type, '');

  const empty = unpackEnvelope({type: '', data: {a: 42}});
  t.equals(empty.namespace, '');
  t.equals(empty.type, '');

  const nonXVIZ = unpackEnvelope({type: 'foo/bar', data: {a: 42}});
  t.equals(nonXVIZ.namespace, 'foo');
  t.equals(nonXVIZ.type, 'bar');

  const leadingSlash = unpackEnvelope({type: '/foo/bar', data: {a: 42}});
  t.equals(leadingSlash.namespace, '');
  t.equals(leadingSlash.type, 'foo/bar');

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
  t.deepEquals(unpackEnvelope(enveloped), expected);

  t.end();
});

// TODO: blacklisted streams in xviz common
tape('parseXVIZData metadata', t => {
  resetXVIZConfigAndSettings();

  const metaMessage = parseXVIZData(TestMetadataMessageV2, {v2Type: 'metadata'});

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZConfig().currentMajorVersion,
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

tape('parseXVIZData metadata v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [1]});

  const metaMessage = parseXVIZData(TestMetadataMessageV1);

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZConfig().currentMajorVersion,
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

tape('parseXVIZData unsupported version v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [2]});

  t.throws(
    () => parseXVIZData(TestMetadataMessageV1),
    /XVIZ version 1 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseXVIZData unsupported version v2', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [1]});

  t.throws(
    () => parseXVIZData(TestMetadataMessageV2, {v2Type: 'metadata'}),
    /XVIZ version 2 is not supported/,
    'Throws if supportedVersions does not match currentMajorVersion'
  );
  t.end();
});

tape('parseXVIZData undetectable version', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({supportedVersions: [2]});

  t.throws(
    () => parseXVIZData({...TestMetadataMessageV2, version: 'abc'}, {v2Type: 'metadata'}),
    /Unable to detect the XVIZ version/,
    'Throws if version exists but cannot parse major version'
  );
  t.end();
});

tape('parseXVIZData metadata with full log time only', t => {
  resetXVIZConfigAndSettings();

  const metaMessage = parseXVIZData(metadataWithLogStartEnd, {v2Type: 'metadata'});

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.METADATA, 'Metadata type set');
  t.equals(
    getXVIZConfig().currentMajorVersion,
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

tape('parseXVIZData validate test data', t => {
  schemaValidator.validate('session/state_update', TestTimesliceMessageV2);
  t.end();
});

tape('parseXVIZData validate result when missing updates', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const metaMessage = parseXVIZData(
    {
      update_type: 'COMPLETE_STATE'
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Type after parse set to error');
  t.ok(/Missing required/.test(metaMessage.message), 'Message details on what is missing');

  t.end();
});

tape('parseXVIZData validate result when updates is empty', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const metaMessage = parseXVIZData(
    {
      update_type: 'COMPLETE_STATE',
      updates: []
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Type after parse set to error');
  t.comment(metaMessage.message);
  t.ok(/"updates" has length of 0/.test(metaMessage.message), 'Message details length is 0');

  t.end();
});

tape('parseXVIZData validate result when missing timestamp in updates', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const metaMessage = parseXVIZData(
    {
      update_type: 'COMPLETE_STATE',
      updates: [{}]
    },
    {v2Type: 'state_update'}
  );

  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Type after parse set to error');
  t.ok(
    /Missing timestamp in "updates"/.test(metaMessage.message),
    'Message details missing timestamp'
  );

  t.end();
});

tape('parseXVIZData error', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const metaMessage = parseXVIZData({message: 'my message'}, {v2Type: 'error'});
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.ERROR, 'Metadata type set to error');

  t.end();
});

tape('parseXVIZData timeslice INCOMPLETE', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  // NOTE: no explicit type for this message yet.
  let metaMessage = parseXVIZData(
    {
      ...TestTimesliceMessageV2,
      timestamp: null
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Missing timestamp is ok');

  metaMessage = parseXVIZData(
    {
      ...TestTimesliceMessageV2,
      updates: [{updates: null}]
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Missing updates incomplete');

  metaMessage = parseXVIZData(
    {
      ...TestTimesliceMessageV2,
      updates: [
        {
          poses: {
            '/vehicle_pose': {
              map_origin: {longitude: 11.2, latitude: 33.4, altitude: 55.6}
            }
          }
        }
      ]
    },
    {v2Type: 'state_update'}
  );
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Missing updates is incomplete');

  metaMessage = parseXVIZData(
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
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.INCOMPLETE, 'Missing timestamp is incomplete');

  t.end();
});

tape('parseXVIZData timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  // NOTE: no explicit type for this message yet.
  let result = parseXVIZData({...TestTimesliceMessageV2}, {v2Type: 'state_update'});
  t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equal(result.updateType, 'COMPLETE', 'XVIZ update type is parsed');
  t.equals(
    result.timestamp,
    TestTimesliceMessageV2.updates[0].poses['/vehicle_pose'].timestamp,
    'Message timestamp set from vehicle_pose'
  );

  // Incremental update
  result = parseXVIZData(
    {...TestTimesliceMessageV2, update_type: 'INCREMENTAL'},
    {v2Type: 'state_update'}
  );
  t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equal(result.updateType, 'INCREMENTAL', 'XVIZ update type is parsed');

  // Deprecated 'snapshot' update type
  result = parseXVIZData(
    {...TestTimesliceMessageV2, update_type: 'SNAPSHOT'},
    {v2Type: 'state_update'}
  );
  t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equal(result.updateType, 'INCREMENTAL', 'XVIZ update type is parsed');

  // Unknown update type
  result = parseXVIZData({...TestTimesliceMessageV2, update_type: ''}, {v2Type: 'state_update'});
  t.equals(
    result.type,
    XVIZ_MESSAGE_TYPE.INCOMPLETE,
    'Should not parse timeslice of unsupported update type'
  );

  t.end();
});

tape('parseXVIZData timeslice without parsing metadata (v1)', t => {
  // NOTE: this is the the teleassist case where they don't have metadata
  // before they start sending log data
  resetXVIZConfigAndSettings();
  setXVIZConfig({PRIMARY_POSE_STREAM: '/vehicle_pose'});
  setXVIZConfig({currentMajorVersion: 1});

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseXVIZData({...TestTimesliceMessageV1});
  t.equals(metaMessage.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equals(
    metaMessage.timestamp,
    TestTimesliceMessageV1.vehicle_pose.time,
    'Message timestamp set from timeslice'
  );
  t.ok(
    metaMessage.streams['/test/stream'].pointCloud,
    'v1 pointCloud is parsed even if metadata was not seen'
  );
  t.is(
    metaMessage.streams['/test/stream'].features[0].type,
    'points3d',
    'pointCloud exposed in features'
  );
  t.deepEquals(metaMessage.streams['/test/stream'].pointCloud.ids, [1234], 'v1 ids are populated');
  t.end();
});

tape('parseXVIZData preProcessPrimitive type change', t => {
  let calledPreProcess = false;
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 1});
  setXVIZConfig({
    PRIMARY_POSE_STREAM: '/vehicle_pose',
    preProcessPrimitive: ({primitive, streamName, time}) => {
      calledPreProcess = true;
      primitive.type = 'circle2d';
    }
  });

  // NOTE: no explicit type for this message yet.
  const metaMessage = parseXVIZData({...TestTimesliceMessageV1});

  t.ok(calledPreProcess, 'Called preProcessPrimitive callback');
  t.equals(
    metaMessage.streams['/test/stream'].pointCloud,
    null,
    'There are no pointClouds in parsed object'
  );

  t.end();
});

tape('parseXVIZData pointCloud timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});
  const PointCloudTestTimesliceMessage = TestTimesliceMessageV2;

  // NOTE: no explicit type for this message yet.
  const slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  const feature = slice.streams['/test/stream'].features[0];
  t.ok(pointCloud, 'has a point cloud');
  t.is(feature.type, 'point', 'pointCloud exposed in features');

  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.equals(pointCloud.positions.length, 3, 'Has 3 values in positions');
  t.equals(pointCloud.positions, feature.points, 'Feature has points');
  t.equals(pointCloud.colors, feature.colors, 'Feature has colors');

  t.end();
});

tape('parseXVIZData polyline flat', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});
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
  const slice = parseXVIZData({...TestTimeslice});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');

  const features = slice.streams['/test/stream'].features;
  t.equals(features.length, 1, 'has has object');
  t.equals(features[0].type, 'polyline', 'type is polyline');
  t.deepEquals(
    features[0].vertices,
    [1000, 1000, 200, 1000, 1000, 250],
    'flat vertices array is returned'
  );

  t.end();
});

tape('parseXVIZData polygon flat', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});
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
  const slice = parseXVIZData({...TestTimeslice});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');

  const features = slice.streams['/test/stream'].features;
  t.equals(features.length, 1, 'has has object');
  t.equals(features[0].type, 'polygon', 'type is polygon');
  t.deepEquals(
    features[0].vertices,
    // We automatically close loops...
    [1000, 1000, 200, 1000, 1000, 250, 1000, 1000, 300],
    'flat vertices array is returned'
  );

  t.end();
});

tape('parseXVIZData flat JSON pointCloud', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});
  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  const stream = PointCloudTestTimesliceMessage.updates[0].primitives['/test/stream'];

  // NOTE: no explicit type for this message yet.
  let slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');

  let pointCloud = slice.streams['/test/stream'].pointCloud;
  const feature = slice.streams['/test/stream'].features[0];
  t.ok(pointCloud, 'has a point cloud');
  t.is(feature.type, 'point', 'pointCloud exposed in features');
  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.deepEquals(pointCloud.positions, [1000, 1000, 200], 'Has correct values in positions');
  t.deepEquals(pointCloud.colors, null, 'Does not contain colors');
  t.equals(pointCloud.positions, feature.points, 'Feature has points');
  t.equals(pointCloud.colors, feature.colors, 'Feature has colors');

  // v1 inline color
  stream.points[0].color = [0, 0, 255];
  slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  pointCloud = slice.streams['/test/stream'].pointCloud;
  t.deepEquals(pointCloud.colors, [0, 0, 255], 'Has correct values in colors');

  // flattened colors stride = 3
  stream.points[0].colors = [[0, 0, 255]];
  slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  pointCloud = slice.streams['/test/stream'].pointCloud;
  t.deepEquals(pointCloud.colors, [0, 0, 255], 'Has correct values in colors');

  // flattened colors stride = 4
  stream.points[0].colors = [[0, 0, 255, 255]];
  slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  pointCloud = slice.streams['/test/stream'].pointCloud;
  t.deepEquals(pointCloud.colors, [0, 0, 255, 255], 'Has correct values in colors');

  t.end();
});

tape('parseXVIZData pointCloud timeslice TypedArray', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  const stream = PointCloudTestTimesliceMessage.updates[0].primitives['/test/stream'];
  stream.points[0].points = new Float32Array([500, 500, 200]);

  // NOTE: no explicit type for this message yet.
  let slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/stream'].pointCloud, 'has a point cloud');

  let pointCloud = slice.streams['/test/stream'].pointCloud;
  t.equals(pointCloud.numInstances, 1, 'Has 1 instance');
  t.deepEquals(pointCloud.positions, [500, 500, 200], 'Has correct values in positions');
  t.deepEquals(pointCloud.colors, null, 'Does not contain colors');

  // flattened colors stride = 3
  stream.points[0].colors = new Uint8Array([0, 0, 255]);
  slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  pointCloud = slice.streams['/test/stream'].pointCloud;
  t.deepEquals(pointCloud.colors, [0, 0, 255], 'Has correct values in colors');

  // flattened colors stride = 4
  stream.points[0].colors = new Uint8Array([0, 0, 255, 255]);
  slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  pointCloud = slice.streams['/test/stream'].pointCloud;
  t.deepEquals(pointCloud.colors, [0, 0, 255, 255], 'Has correct values in colors');

  t.end();
});

tape('parseXVIZData pointCloud timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const PointCloudTestTimesliceMessage = clone(TestTimesliceMessageV2);
  PointCloudTestTimesliceMessage.updates[0].primitives['/test/stream'].points.push({
    base: {
      object_id: '1235',
      style: {
        fill_color: [255, 255, 255]
      }
    },
    points: new Float32Array([1000, 1000, 200])
  });

  // NOTE: no explicit type for this message yet.
  const slice = parseXVIZData({...PointCloudTestTimesliceMessage});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');

  const pointCloud = slice.streams['/test/stream'].pointCloud;
  const feature = slice.streams['/test/stream'].features[0];
  t.ok(pointCloud, 'has a point cloud');
  t.is(feature.type, 'point', 'pointCloud exposed in features');

  t.equals(pointCloud.numInstances, 2, 'Has 2 instance');
  t.equals(pointCloud.positions.length, 6, 'Has 6 values in positions');
  t.equals(pointCloud.ids.length, 2, 'Has 2 values in ids');
  t.equals(pointCloud.positions, feature.points, 'Feature has points');
  t.equals(pointCloud.colors, feature.colors, 'Feature has colors');

  t.end();
});

tape('parseXVIZData variable timeslice', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});
  const VariableTestTimesliceMessage = {
    update_type: 'COMPLETE_STATE',
    updates: [
      {
        timestamp: 1001.0,
        poses: {
          '/vehicle_pose': {
            timestamp: 1001.0,
            map_origin: [11.2, 33.4, 55.6],
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
  const slice = parseXVIZData({...VariableTestTimesliceMessage});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/foo'].variable, 'has variable');

  const variable = slice.streams['/foo'].variable;
  t.equals(variable.length, 2, 'Has 2 instances');
  t.equals(variable[0].id, 'A', 'Has correct id');
  t.deepEquals(variable[0].values, [300, 400], 'Has correct values');

  t.end();
});

tape('parseXVIZData futures timeslice v1', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 1});

  const slice = parseXVIZData({...TestFuturesMessageV1});
  t.equals(slice.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.ok(slice.streams['/test/polygon'].lookAheads, 'has lookAheads field');

  const lookAheads = slice.streams['/test/polygon'].lookAheads;
  t.equals(lookAheads.length, 2, 'Has 2 primitive sets in lookAheads');

  t.end();
});

tape('parseXVIZData state_update, PERSISTENT', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2, ALLOW_MISSING_PRIMARY_POSE: true});

  const persistentMsg = {...TestTimesliceMessageV2};
  persistentMsg.update_type = 'PERSISTENT';

  const result = parseXVIZData(persistentMsg, {v2Type: 'state_update'});
  t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equal(result.updateType, 'PERSISTENT', 'XVIZ update type is parsed');
  t.equals(result.timestamp, TestTimesliceMessageV2.updates[0].timestamp, 'Message timestamp set');

  const feature = result.streams['/test/stream'].features[0];
  t.equal(feature.type, 'point', 'feature has type point');
  t.deepEquals(Array.from(feature.points), [1000, 1000, 200], 'feature has type point');

  t.end();
});

tape('parseXVIZData state_update, no_data_streams', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2, ALLOW_MISSING_PRIMARY_POSE: true});

  const noDataStreamMsg = {...TestTimesliceMessageV2};
  noDataStreamMsg.updates[0].no_data_streams = ['/no-data-stream'];

  const result = parseXVIZData(noDataStreamMsg, {v2Type: 'state_update'});
  t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
  t.equal(result.updateType, 'COMPLETE', 'XVIZ update type is parsed');
  t.equals(result.timestamp, TestTimesliceMessageV2.updates[0].timestamp, 'Message timestamp set');

  t.equal(result.streams['/no-data-stream'], null, 'no_data_stream marked as null');

  t.end();
});

tape('parseXVIZMessageSync', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const samples = [
    {
      name: 'bare',
      message: {...TestTimesliceMessageV2}
    },
    {
      name: 'enveloped',
      message: {
        type: 'xviz/state_update',
        data: {...TestTimesliceMessageV2}
      }
    }
  ];

  const testCases = [];

  for (const sample of samples) {
    const jsonString = JSON.stringify(sample.message);
    const binary = new TextEncoder().encode(jsonString);

    testCases.push(
      {
        title: `${sample.name} - plain JSON object`,
        message: sample.message
      },
      {
        title: `${sample.name} - JSON string`,
        message: jsonString
      },
      {
        title: `${sample.name} - Uint8Array`,
        message: binary
      },
      {
        title: `${sample.name} - ArrayBuffer`,
        message: binary.buffer
      }
    );
  }

  for (const testCase of testCases) {
    t.comment(testCase.title);
    let result;
    let error;
    const opts = {};
    parseXVIZMessageSync(
      testCase.message,
      newResult => {
        result = newResult;
      },
      newError => {
        error = newError;
      },
      opts
    );

    t.equals(undefined, error, 'No errors received while parsing');
    t.equals(result.type, XVIZ_MESSAGE_TYPE.TIMESLICE, 'Message type set for timeslice');
    t.equals(
      result.timestamp,
      TestTimesliceMessageV2.updates[0].poses['/vehicle_pose'].timestamp,
      'Message timestamp set from vehicle_pose'
    );
  }

  t.end();
});

tape('parseXVIZMessageSync#enveloped#metadata', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const enveloped = {
    type: 'xviz/metadata',
    data: {version: '2.0.0'}
  };

  let result;
  let error;
  const opts = {};
  parseXVIZMessageSync(
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
  t.equals(result.type, XVIZ_MESSAGE_TYPE.METADATA, 'Message type set for metadata');
  t.equals(result.version, enveloped.data.version);

  t.end();
});

tape('parseXVIZMessageSync#enveloped#transform_log_done', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const enveloped = {
    type: 'xviz/transform_log_done',
    data: {id: 'foo'}
  };

  let result;
  let error;
  const opts = {};
  parseXVIZMessageSync(
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
  t.equals(result.type, XVIZ_MESSAGE_TYPE.DONE, 'Message type set to done');
  t.equals(result.id, enveloped.data.id);

  t.end();
});

tape('parseXVIZMessageSync enveloped not xviz', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const enveloped = {
    type: 'bar/foo',
    data: {a: 42}
  };

  let result;
  let error;
  const opts = {};
  parseXVIZMessageSync(
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

tape('isXVIZMessage & getXVIZMessageType', t => {
  const testCases = [
    {
      title: 'type at start',
      isValid: true,
      message: {
        type: 'xviz/state_update',
        data: {...TestTimesliceMessageV2}
      }
    },
    {
      title: 'type at end',
      isValid: true,
      message: {
        data: {...TestMetadataMessageV2},
        type: 'xviz/metadata'
      }
    },
    {
      title: 'not enveloped',
      isValid: false,
      message: {...TestTimesliceMessageV2}
    },
    {
      title: 'unknown namespace',
      isValid: false,
      message: {
        type: 'foo/bar'
      }
    },
    {
      title: 'empty',
      isValid: false,
      message: null
    }
  ];

  const validateMessageType = (tt, testcase, msg) => {
    if (testcase.isValid) {
      const type = testcase.isBinary ? testcase.expectedType : testcase.message.type;
      tt.is(getXVIZMessageType(msg), type, 'XVIZ type matches');
    } else {
      tt.is(getXVIZMessageType(msg), null, 'XVIZ type correctly null');
    }
  };

  for (const testCase of testCases) {
    t.comment(testCase.title);
    t.is(isXVIZMessage(testCase.message), testCase.isValid, 'plain JSON object');
    validateMessageType(t, testCase, testCase.message);

    const jsonString = JSON.stringify(testCase.message);
    t.is(isXVIZMessage(jsonString), testCase.isValid, 'JSON string');
    validateMessageType(t, testCase, jsonString);

    const binary = new TextEncoder().encode(jsonString);
    t.is(isXVIZMessage(binary), testCase.isValid, 'Uint8Array');
    t.is(isXVIZMessage(binary.buffer), testCase.isValid, 'ArrayBuffer');
    validateMessageType(t, testCase, binary);
    validateMessageType(t, testCase, binary.buffer);
  }

  t.end();
});

tape('isXVIZMessage & getXVIZMessageType with Binary XVIZ', t => {
  const testCases = [
    {
      title: 'binary metadata',
      isValid: true,
      expectedType: 'xviz/metadata',
      message: MinimalBinaryMetadata
    },
    {
      title: 'binary state_update',
      isValid: true,
      expectedType: 'xviz/state_update',
      message: MinimalBinaryStateUpdate
    }
    // TODO: add non XVIZ test cases
  ];

  const validateMessageType = (tt, testcase, msg) => {
    if (testcase.isValid) {
      tt.is(getXVIZMessageType(msg), testcase.expectedType, 'XVIZ type matches');
    } else {
      tt.is(getXVIZMessageType(msg), null, 'XVIZ Type correctly null');
    }
  };

  for (const testCase of testCases) {
    t.comment(testCase.title);

    t.is(isXVIZMessage(testCase.message), testCase.isValid, 'binary JSON object');
    validateMessageType(t, testCase, testCase.message);
  }

  t.end();
});

tape('getDataFormat', t => {
  const XVIZUpdateObject = {type: 'xviz/state_update', data: TestTimesliceMessageV2};
  const XVIZUpdateString = JSON.stringify(XVIZUpdateObject);

  const testCases = [
    {
      title: 'binary format',
      expectedFormat: 'binary',
      message: MinimalBinaryMetadata
    },
    {
      title: 'object format',
      expectedFormat: 'object',
      message: XVIZUpdateObject
    },
    {
      title: 'format',
      expectedFormat: 'string',
      message: XVIZUpdateString
    }
  ];

  for (const testCase of testCases) {
    t.comment(testCase.title);
    t.is(getDataFormat(testCase.message), testCase.expectedFormat, 'format matches');
  }

  t.end();
});

tape('parseXVIZData timeslice with link', t => {
  resetXVIZConfigAndSettings();
  setXVIZConfig({currentMajorVersion: 2});

  const testData = {
    update_type: 'COMPLETE_STATE',
    updates: [
      {
        timestamp: 1001.0,
        poses: {
          '/vehicle_pose': {
            timestamp: 1001.0,
            map_origin: {longitude: 11.2, latitude: 33.4, altitude: 55.6},
            position: [1.1, 2.2, 3.3],
            orientation: [0.1, 0.2, 0.3]
          }
        },
        links: {
          '/vehicle_pose/lidar': {
            target_pose: '/vehicle_pose'
          }
        },
        primitives: {
          '/vehicle_pose/lidar': {
            points: [
              {
                points: [[1000, 1000, 200]]
              }
            ]
          }
        }
      }
    ]
  };

  const result = parseXVIZData({...testData}, {v2Type: 'state_update'});

  t.ok(result.links, 'Has links entry');
  t.equal(Object.keys(result.links).length, 1, 'Has 1 entry in links object');

  const link = result.links['/vehicle_pose/lidar'];
  t.ok(link, 'lidar link entry defined');
  t.equal(link.target_pose, '/vehicle_pose', 'link has correct target_pose');

  t.end();
});
