import json
from easydict import EasyDict as edict

from xviz_avs.builder import XVIZBuilder, XVIZUIPrimitiveBuilder, XVIZTimeSeriesBuilder
from google.protobuf.json_format import MessageToDict
import unittest

PRIMARY_POSE_STREAM = '/vehicle_pose'

DEFAULT_POSE = edict(
  timestamp=1.0,
  map_origin=edict(longitude=1.1, latitude=2.2, altitude=3.3),
  position=[11., 22., 33.],
  orientation=[0.11, 0.22, 0.33]
)

def setup_pose(builder):
    builder.pose(PRIMARY_POSE_STREAM)\
        .timestamp(DEFAULT_POSE.timestamp)\
        .map_origin(**DEFAULT_POSE.map_origin)\
        .position(*DEFAULT_POSE.position)\
        .orientation(*DEFAULT_POSE.orientation)

class TestPoseBuilder(unittest.TestCase):

    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_single_pose(self):
        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            }
        }

        data = self.builder.get_data().to_object()
        assert json.dumps(data, sort_keys=True) == json.dumps(expected, sort_keys=True)

    def test_multiple_poses(self):
        self.builder.pose('/vehicle-pose-2')\
            .timestamp(2.0)\
            .map_origin(4.4, 5.5, 6.6)\
            .position(44., 55., 66.)\
            .orientation(0.44, 0.55, 0.66)

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE,
                "/vehicle-pose-2": {
                    'timestamp': 2.0,
                    'map_origin': {'longitude': 4.4, 'latitude': 5.5, 'altitude': 6.6},
                    'position': [44., 55., 66.],
                    'orientation': [0.44, 0.55, 0.66]
                }
            }
        }

        data = self.builder.get_data().to_object()
        assert json.dumps(data, sort_keys=True) == json.dumps(expected, sort_keys=True)

class TestPrimitiveBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_polygon(self):
        verts = [0., 0., 0., 4., 0., 0., 4., 3., 0.]
        self.builder.primitive('/test/polygon')\
            .polygon(verts)\
            .id('1')\
            .style({
                'fill_color': [255, 0, 0]
            })

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'primitives': {
                '/test/polygon': {
                    'polygons': [
                        {
                            'base': {
                                'style': {
                                    'fill_color': [255, 0, 0],
                                },
                                'object_id': '1'
                            },
                            'vertices': verts
                        }
                    ]
                }
            }
        }

        data = self.builder.get_data().to_object()
        assert json.dumps(data, sort_keys=True) == json.dumps(expected, sort_keys=True)

class TestUIPrimitiveBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_null(self):
        builder = XVIZUIPrimitiveBuilder(None, None)
        data = builder.stream('/test').get_data()

        assert data is None

    def test_treetable(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}] # FIXME: type is in lower case in XVIZ
        self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    # 'nodes': [] # FIXME: nodes are no serialized
                }
            }
        }
        assert json.dumps(data['ui_primitives'], sort_keys=True) == json.dumps(expected, sort_keys=True)

class TestTimeSeriesBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_null(self):
        builder = XVIZTimeSeriesBuilder(None, None)
        data = builder.stream('/test').get_data()

        assert data is None

    def test_single_entry(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

        self.builder.time_series('/test')\
            .timestamp(20.)\
            .value(1.)

        expected = [{
            'timestamp': 20.,
            'streams': ['/test'],
            'values': {'doubles': [1.]}
        }]
        data = self.builder.get_data().to_object()
        assert json.dumps(data['time_series'], sort_keys=True) == json.dumps(expected, sort_keys=True)

    def test_multiple_entries(self):
        self.builder.time_series('/test')\
            .timestamp(20.)\
            .value(1.)

        self.builder.time_series('/foo')\
            .timestamp(20.)\
            .value(2.)

        expected = [{
            'timestamp': 20.,
            'streams': ['/test', '/foo'],
            'values': {'doubles': [1., 2.]}
        }]
        data = self.builder.get_data().to_object()
        assert json.dumps(data['time_series'], sort_keys=True) == json.dumps(expected, sort_keys=True)


class TestFutureInstanceBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_primitives(self):
        verts = [1., 0., 0., 1., 1., 0., 1., 1., 1.]
        self.builder.future_instance('/test/future_circle', 1.0)\
            .circle([1., 0., 0.], 2)
        self.builder.future_instance('/test/future_text', 1.0)\
            .text('testing')\
            .position([1., 1., 0.])
        self.builder.future_instance('/test/future_stadium', 1.0)\
            .stadium([1., 0., 0.], [1., 1., 0.], 2)
        self.builder.future_instance('/test/future_points', 1.0)\
            .points([1., 1., 1.])
        self.builder.future_instance('/test/future_polyline', 1.0)\
            .polyline([1., 1., 1.])
        self.builder.future_instance('/test/future_polygon', 1.0)\
            .polygon(verts)\
            .id('1')

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'future_instances': {
                '/test/future_circle': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'circles': [
                                {
                                    'center': [1., 0., 0.],
                                    'radius': 2.0
                                }
                            ]
                        }
                    ]
                },
                '/test/future_text': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'texts': [
                                {
                                    'text': 'testing',
                                    'position': [1., 1., 0.]
                                }
                            ]
                        }
                    ]
                },
                '/test/future_stadium': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'stadiums': [
                                {
                                    'start': [1., 0., 0.],
                                    'end': [1., 1., 0.],
                                    'radius': 2.0
                                }
                            ]
                        }
                    ]
                },
                '/test/future_points': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'points': [
                                {
                                    'points': [1., 1., 1.]
                                }
                            ]
                        }
                    ]
                },
                '/test/future_polyline': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'polylines': [
                                {
                                    'vertices': [1., 1., 1.]
                                }
                            ]
                        }
                    ]
                },
                '/test/future_polygon': {
                    'timestamps': [1.0],
                    'primitives': [
                        {
                            'polygons': [
                                {
                                    'base': {
                                        'object_id': '1'
                                    },
                                    'vertices': verts
                                }
                            ]
                        }
                    ]
                }
            }
        }

        data = self.builder.get_data().to_object()
        assert data == expected

    def test_multiple_inserts(self):
        verts = [1., 0., 0., 1., 1., 0., 1., 1., 1.]
        # TODO test style({'fill_color': [255, 0, 0]})
        self.builder.future_instance('/test/future_polygon', 1.0)\
            .polygon(verts)\
            .id('1')
        self.builder.future_instance('/test/future_polygon', 1.1)\
            .polygon(verts)\
            .id('1')
        self.builder.future_instance('/test/future_polygon', 1.0)\
            .polygon(verts)\
            .id('2')

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'future_instances': {
                '/test/future_polygon': {
                    'timestamps': [1.0, 1.1],
                    'primitives': [
                        {
                            'polygons': [
                                {
                                    'base': {
                                        'object_id': '1'
                                    },
                                    'vertices': verts
                                },
                                {
                                    'base': {
                                        'object_id': '2'
                                    },
                                    'vertices': verts
                                }
                            ]
                        },
                        {
                            'polygons': [
                                {
                                    'base': {
                                        'object_id': '1'
                                    },
                                    'vertices': verts
                                }
                            ]
                        }
                    ]
                }
            }
        }

        data = self.builder.get_data().to_object()
        assert data == expected

    def test_multiple_inserts_reverse_order(self):
        verts = [1., 0., 0., 1., 1., 0., 1., 1., 1.]
        self.builder.future_instance('/test/future_polygon', 1.1)\
            .polygon(verts)\
            .id('1')
        self.builder.future_instance('/test/future_polygon', 1.0)\
            .polygon(verts)\
            .id('1')

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'future_instances': {
                '/test/future_polygon': {
                    'timestamps': [1.0, 1.1],
                    'primitives': [
                        {
                            'polygons': [
                                {
                                    'base': {
                                        'object_id': '1'
                                    },
                                    'vertices': verts
                                }
                            ]
                        },
                        {
                            'polygons': [
                                {
                                    'base': {
                                        'object_id': '1'
                                    },
                                    'vertices': verts
                                }
                            ]
                        }
                    ]
                }
            }
        }

        data = self.builder.get_data().to_object()
        assert data == expected
