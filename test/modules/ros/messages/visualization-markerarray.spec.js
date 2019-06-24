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
import tape from 'tape-catch';

import {VisualizationMarkerArray, VisualizationMarker} from '@xviz/ros';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

const TYPE = {
  ARROW: 0,
  SPHERE: 2,
  LINE_STRIP: 4,
  LINE_LIST: 5,
  TEXT_VIEW_FACING: 9
};

const ACTION = {
  ADD: 0,
  DELETE: 2,
  DELETEALL: 3
};

const DFLT_POSE = {
  position: {
    x: 1,
    y: 2,
    z: 3
  },
  orientation: {
    x: 0,
    y: 0,
    z: 0,
    w: 0
  }
};

const DFLT_SCALE = {
  x: 1,
  y: 1,
  z: 1
};

const DFLT_POINTS = [
  {
    x: 2,
    y: 2,
    z: 2
  },
  {
    x: 3,
    y: 3,
    z: 3
  }
];

function makeArrow(id, pose = DFLT_POSE, points = DFLT_POINTS, action = ACTION.ADD) {
  return makeMarker(id, TYPE.ARROW, action, pose, {points});
}

function makeSphere(id, pose = DFLT_POSE, points = DFLT_POINTS, action = ACTION.ADD) {
  return makeMarker(id, TYPE.SPHERE, action, pose, {points});
}

function makeLineStrip(id, pose = DFLT_POSE, points = DFLT_POINTS, action = ACTION.ADD) {
  return makeMarker(id, TYPE.LINE_STRIP, action, pose, {points});
}

function makeLineList(id, pose = DFLT_POSE, points = DFLT_POINTS, action = ACTION.ADD) {
  return makeMarker(id, TYPE.LINE_LIST, action, pose, {points});
}

function makeText(id, pose = DFLT_POSE, text = '', action = ACTION.ADD) {
  return makeMarker(id, TYPE.TEXT_VIEW_FACING, action, pose, {text});
}

function makeMarker(id, type, action, pose, {points, text, scale = DFLT_SCALE}) {
  return {
    ns: 'test',
    id,
    type,
    action,
    pose,
    scale,
    lifetime: {
      sec: 0,
      nsec: 0
    },
    points,
    text,
    colors: {r: 0.5, g: 0.1, b: 0.1, a: 1}
  };
}

const expectedMetadata = {
  version: '2.0.0',
  streams: {
    '/markers/arrow': {
      coordinate: 'IDENTITY',
      category: 'PRIMITIVE',
      primitive_type: 'POLYLINE'
    },
    '/markers/linestrip': {
      coordinate: 'IDENTITY',
      category: 'PRIMITIVE',
      stream_style: {stroke_width: 0.2, stroke_width_min_pixels: 1},
      primitive_type: 'POLYLINE'
    },
    '/markers/linelist': {
      coordinate: 'IDENTITY',
      category: 'PRIMITIVE',
      stream_style: {stroke_width: 0.2, stroke_width_min_pixels: 1},
      primitive_type: 'POLYLINE'
    },
    '/markers/sphere': {
      coordinate: 'IDENTITY',
      category: 'PRIMITIVE',
      stream_style: {stroke_width: 0.2},
      primitive_type: 'CIRCLE'
    },
    '/markers/text': {
      category: 'PRIMITIVE',
      stream_style: {size: 18, fill_color: '#0000FF'},
      primitive_type: 'TEXT'
    },
    '/vehicle_pose': {category: 'POSE'}
  }
};
const expectedArrow = {
  '/markers/arrow': {
    polylines: [
      {
        vertices: [
          [3, 4, 0],
          [3.7, 4.7, 0],
          [3.2928932188134525, 5, 0],
          [4, 5, 0],
          [4, 4.292893218813452, 0],
          [3.7, 4.7, 0]
        ],
        base: {
          object_id: 'test/0',
          style: {
            stroke_color: [128, 128, 128, 255]
          }
        }
      }
    ]
  }
};
const expectedSphere = {
  '/markers/sphere': {
    circles: [
      {
        center: [1, 2, 0],
        radius: 0.5,
        base: {
          object_id: 'test/1',
          style: {
            fill_color: [128, 128, 128, 255]
          }
        }
      }
    ]
  }
};
const expectedLineList = {
  '/markers/linelist': {
    polylines: [
      {
        vertices: [[3, 4, 0], [4, 5, 0]],
        base: {
          object_id: 'test/2/0',
          style: {
            stroke_color: [128, 128, 128, 255]
          }
        }
      }
    ]
  }
};
const expectedLineStrip = {
  '/markers/linestrip': {
    polylines: [
      {
        vertices: [[3, 4, 0], [4, 5, 0]],
        base: {
          object_id: 'test/3',
          style: {
            stroke_color: [128, 128, 128, 255]
          }
        }
      }
    ]
  }
};
const expectedText = {
  '/markers/text': {
    texts: [
      {
        position: [1, 2, 0],
        text: 'test'
      }
    ]
  }
};

tape('VisualizationMarkerArray#basic', async t => {
  t.equals(VisualizationMarkerArray.name, 'VisualizationMarkerArray', 'Name is correct');
  t.equals(
    VisualizationMarkerArray.messageType,
    'visualization_msgs/MarkerArray',
    'Message Type is correct'
  );

  const converter = new VisualizationMarkerArray({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          markers: [
            makeArrow(0),
            makeSphere(1),
            makeLineList(2),
            makeLineStrip(3),
            makeText(4, DFLT_POSE, 'test')
          ]
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedArrow,
          ...expectedSphere,
          ...expectedLineList,
          ...expectedLineStrip,
          ...expectedText
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});

tape('VisualizationMarker#arrow', async t => {
  t.equals(VisualizationMarker.name, 'VisualizationMarker', 'Name is correct');
  t.equals(VisualizationMarker.messageType, 'visualization_msgs/Marker', 'Message Type is correct');

  const converter = new VisualizationMarker({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          ...makeArrow(0)
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedArrow
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});

tape('VisualizationMarker#sphere', async t => {
  t.equals(VisualizationMarker.name, 'VisualizationMarker', 'Name is correct');
  t.equals(VisualizationMarker.messageType, 'visualization_msgs/Marker', 'Message Type is correct');

  const converter = new VisualizationMarker({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          ...makeSphere(1)
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedSphere
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});

tape('VisualizationMarker#linelist', async t => {
  t.equals(VisualizationMarker.name, 'VisualizationMarker', 'Name is correct');
  t.equals(VisualizationMarker.messageType, 'visualization_msgs/Marker', 'Message Type is correct');

  const converter = new VisualizationMarker({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          ...makeLineList(2)
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedLineList
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});

tape('VisualizationMarker#linestrip', async t => {
  t.equals(VisualizationMarker.name, 'VisualizationMarker', 'Name is correct');
  t.equals(VisualizationMarker.messageType, 'visualization_msgs/Marker', 'Message Type is correct');

  const converter = new VisualizationMarker({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          ...makeLineStrip(3)
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedLineStrip
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});

tape('VisualizationMarker#text', async t => {
  t.equals(VisualizationMarker.name, 'VisualizationMarker', 'Name is correct');
  t.equals(VisualizationMarker.messageType, 'visualization_msgs/Marker', 'Message Type is correct');

  const converter = new VisualizationMarker({topic: '/markers'});

  const metaBuilder = new XVIZMetadataBuilder();
  converter.getMetadata(metaBuilder);
  metaBuilder.stream('/vehicle_pose').category('pose');
  const metadata = metaBuilder.getMetadata();

  t.deepEquals(metadata, expectedMetadata, 'Metadata is correct');

  const frame = {
    '/markers': [
      {
        timestamp: {sec: 1000, nsec: 0},
        message: {
          ...makeText(4, DFLT_POSE, 'test')
        }
      }
    ]
  };
  const builder = new XVIZBuilder();
  // Define required pose
  builder
    .pose('/vehicle_pose')
    .position(0, 0, 0)
    .timestamp(1000);

  converter.convertMessage(frame, builder);
  const message = builder.getMessage();

  const expected = {
    update_type: 'SNAPSHOT',
    updates: [
      {
        timestamp: 1000,
        poses: {
          '/vehicle_pose': {
            timestamp: 1000,
            position: [0, 0, 0]
          }
        },
        primitives: {
          ...expectedText
        }
      }
    ]
  };

  t.deepEquals(message, expected, 'Message matches expected');
  t.end();
});
