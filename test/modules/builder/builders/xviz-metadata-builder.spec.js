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

/* eslint-disable camelcase */
import test from 'tape-catch';
import {Matrix4} from 'math.gl';
import {XVIZMetadataBuilder, XVIZUIBuilder} from '@xviz/builder';
import {XVIZValidator} from '@xviz/schema';

const schemaValidator = new XVIZValidator();

test('XVIZMetadataBuilder#default-ctor', t => {
  const xb = new XVIZMetadataBuilder();
  t.ok(xb, 'Created new XVIZMetadataBuilder');
  t.end();
});

test.skip('XVIZMetadataBuilder#build-with-transformMatrix-array', t => {
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0)
    .endTime(1)
    .stream('/test/stream')
    .category('primitive')
    .type('circle')
    .coordinate('VEHICLE_RELATIVE')
    .transformMatrix([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]])
    .streamStyle({fill_color: [255, 0, 0]})
    .styleClass('test-style', {fill_color: [0, 255, 0]});

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    version: '2.0.0',
    streams: {
      '/test/stream': {
        category: 'primitive',
        primitive_type: 'circle',
        coordinate: 'VEHICLE_RELATIVE',
        transform: new Matrix4([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]),
        stream_style: {
          fill_color: [255, 0, 0]
        },
        style_classes: [
          {
            name: 'test-style',
            style: {
              fill_color: [0, 255, 0]
            }
          }
        ]
      }
    },
    log_info: {
      start_time: 0,
      end_time: 1
    }
  };

  t.deepEqual(
    metadata,
    expected,
    'XVIZMetadataBuilder build with transformMatrix matches expected output'
  );
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test.skip('XVIZMetadataBuilder#build-with-transformMatrix-matrix4', t => {
  const matrix = new Matrix4().translate([1, 2, 3]);
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0)
    .endTime(1)
    .stream('/test/stream')
    .category('primitive')
    .type('circle')
    .coordinate('VEHICLE_RELATIVE')
    .transformMatrix(matrix);

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    version: '2.0.0',
    streams: {
      '/test/stream': {
        category: 'primitive',
        primitive_type: 'circle',
        coordinate: 'VEHICLE_RELATIVE',
        transform: new Matrix4([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [1, 2, 3, 1]])
      }
    },
    log_info: {
      start_time: 0,
      end_time: 1
    }
  };

  t.deepEqual(
    metadata,
    expected,
    'XVIZMetadataBuilder build with transformMatrix matches expected output'
  );
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test('XVIZMetadataBuilder#build-with-pose', t => {
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0)
    .endTime(1)
    .stream('/test/stream')
    .category('primitive')
    .type('polygon')
    .pose({x: 1, y: 2, z: 3});

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    version: '2.0.0',
    streams: {
      '/test/stream': {
        category: 'primitive',
        primitive_type: 'polygon',
        transform: new Matrix4([1, 0, -0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1])
      }
    },
    log_info: {
      start_time: 0,
      end_time: 1
    }
  };

  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build with pose matches expected output');
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test('XVIZMetadataBuilder#multiple-streams', t => {
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0)
    .endTime(1)
    .stream('/test-stream/1')
    .category('primitive')
    .type('polygon')
    .stream('/test-stream/2')
    .category('variable')
    .type('float');

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    version: '2.0.0',
    streams: {
      '/test-stream/1': {
        category: 'primitive',
        primitive_type: 'polygon'
      },
      '/test-stream/2': {
        category: 'variable',
        scalar_type: 'float'
      }
    },
    log_info: {
      start_time: 0,
      end_time: 1
    }
  };

  t.deepEqual(
    metadata,
    expected,
    'XVIZMetadataBuilder multiple streams build matches expected output'
  );
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test('XVIZMetadataBuilder#stylesheet', t => {
  const xb = new XVIZMetadataBuilder();
  xb.stream('/test').streamStyle({
    stroke_color: '#57AD57AA',
    stroke_width: 1.4,
    stroke_width_min_pixels: 1
  });

  const metadata = xb.getMetadata();

  const expected = {
    version: '2.0.0',
    streams: {
      '/test': {
        stream_style: {
          stroke_color: '#57AD57AA',
          stroke_width: 1.4,
          stroke_width_min_pixels: 1
        }
      }
    }
  };

  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build matches expected output');
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test('XVIZMetadataBuilder#stylesheet', t => {
  const xb = new XVIZMetadataBuilder();
  xb.stream('/test').streamStyle({
    stroke_color: '#57AD57AA',
    stroke_width: 1.4,
    stroke_width_min_pixels: 1
  });

  const metadata = xb.getMetadata();

  const expected = {
    version: '2.0.0',
    streams: {
      '/test': {
        stream_style: {
          stroke_color: '#57AD57AA',
          stroke_width: 1.4,
          stroke_width_min_pixels: 1
        }
      }
    }
  };

  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build matches expected output');
  schemaValidator.validate('session/metadata', metadata);
  t.end();
});

test('XVIZMetadataBuilder#ui', t => {
  const xb = new XVIZMetadataBuilder();
  const uiBuilder = new XVIZUIBuilder({});
  xb.ui(uiBuilder);

  const panel = uiBuilder.panel({name: 'Metrics'});
  uiBuilder.child(panel);

  const metadata = xb.getMetadata();
  const expected = {
    version: '2.0.0',
    streams: {},
    ui_config: {Metrics: {type: 'panel', name: 'Metrics'}}
  };
  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build matches expected output');

  t.end();
});
