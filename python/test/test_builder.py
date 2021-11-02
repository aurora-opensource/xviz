import json
from easydict import EasyDict as edict

from xviz_avs.builder import XVIZBuilder, XVIZUIPrimitiveBuilder, XVIZTimeSeriesBuilder, XVIZVariableBuilder
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

    def test_image(self):
        data = bytes(b'12345')
        self.builder.primitive('/camera/1')\
            .image(data)

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'primitives': {
                '/camera/1': {
                    'images': [
                        {
                            'data': 'MTIzNDU='
                        }
                    ]
                }
            }
        }

        assert self.builder.get_data().to_object() == expected

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

    def test_treetable_no_rows(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}]
        self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS
                }
            }
        }
        assert data['ui_primitives'] == expected

    def test_treetable_row(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}]
        table = self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        table.row(None, ['Test Row 1'])
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    'nodes': [{'column_values': ['Test Row 1']}]
                }
            }
        }
        assert data['ui_primitives'] == expected

    def test_treetable_rows(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}]
        table = self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        table.row(None, ['Test Row 1'])
        table.row(None, ['Test Row 2'])
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    'nodes': [
                        {'column_values': ['Test Row 1']},
                        {'column_values': ['Test Row 2']}
                    ]
                }
            }
        }
        assert data['ui_primitives'] == expected

    def test_treetable_row_children(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}]
        table = self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        row1 = table.row(1, ['Test Row 1'])
        row1 = row1.child(2, ['Test Row 2'])
        row2 = table.row(10, ['Test Row 10'])
        row2 = row2.child(20, ['Test Row 20'])
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    'nodes': [
                        {'id': 1, 'column_values': ['Test Row 1']},
                        {'parent': 1, 'id': 2, 'column_values': ['Test Row 2']},
                        {'id': 10, 'column_values': ['Test Row 10']},
                        {'parent': 10, 'id': 20, 'column_values': ['Test Row 20']}
                    ]
                }
            }
        }
        assert data['ui_primitives'] == expected

    def test_treetable_row_children_creation_order(self):
        TEST_COLUMNS = [{'display_text': 'Name', 'type': 'STRING'}]
        table = self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        # Ensure rows can be created and references remain valid
        row1 = table.row(1, ['Test Row 1'])
        row2 = table.row(10, ['Test Row 10'])

        # Children can be added to rows
        row1.child(2, ['Test Row 2'])
        row2.child(20, ['Test Row 20'])
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    'nodes': [
                        {'id': 1, 'column_values': ['Test Row 1']},
                        {'parent': 1, 'id': 2, 'column_values': ['Test Row 2']},
                        {'id': 10, 'column_values': ['Test Row 10']},
                        {'parent': 10, 'id': 20, 'column_values': ['Test Row 20']}
                    ]
                }
            }
        }
        assert data['ui_primitives'] == expected


    def test_treetable_column_types(self):
        TEST_COLUMNS = [
            {'display_text': 'string', 'type': 'STRING'},
            {'display_text': 'int32', 'type': 'INT32'},
            {'display_text': 'bool', 'type': 'BOOLEAN'},
            {'display_text': 'double', 'type': 'DOUBLE'}
        ]
        table = self.builder.ui_primitives('/test').treetable(TEST_COLUMNS)
        table.row(1, ['Test', 1, True, 3.14159])
        data = self.builder.get_data().to_object()

        expected = {
            '/test': {
                'treetable': {
                    'columns': TEST_COLUMNS,
                    'nodes': [
                        {'id': 1, 'column_values': ['Test', '1', 'True', '3.14159']}
                    ]
                }
            }
        }
        assert data['ui_primitives'] == expected


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

    def test_zero_value_attribute_check(self):
        self.builder.time_series('/test')\
            .timestamp(20.)\
            .value(0.)

        self.builder.time_series('/foo')\
            .timestamp(20.)\
            .value(2.)

        expected = [{
            'timestamp': 20.,
            'streams': ['/test', '/foo'],
            'values': {'doubles': [0., 2.]}
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


class TestVariableBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()
        setup_pose(self.builder)

    def test_null(self):
        builder = XVIZVariableBuilder(None, None)
        data = builder.stream('/test').get_data()

        assert data is None

    def test_int32s_variable(self):
        self.builder.variable('/test_var').values([1, 2, 3])
        self.builder.variable('/test_var').values([1, 2, 3]).id('id-1')
        data = self.builder.get_data().to_object()

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'variables': {
                '/test_var': {
                    'variables': [
                        {
                            'values': {
                                'int32s': [1, 2, 3]
                            }
                        },
                        {
                            'base': {
                                'object_id': 'id-1'
                            },
                            'values': {
                                'int32s': [1, 2, 3]
                            }
                        }
                    ]
                }
            }
        }

        assert data == expected

    def test_doubles_variable(self):
        self.builder.variable('/test_var').values([1.0, 2.0, 3.0])
        self.builder.variable('/test_var').values([1.0, 2.0, 3.0]).id('id-1')
        data = self.builder.get_data().to_object()

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'variables': {
                '/test_var': {
                    'variables': [
                        {
                            'values': {
                                'doubles': [1.0, 2.0, 3.0]
                            }
                        },
                        {
                            'base': {
                                'object_id': 'id-1'
                            },
                            'values': {
                                'doubles': [1.0, 2.0, 3.0]
                            }
                        }
                    ]
                }
            }
        }

        assert data == expected

    def test_strings_variable(self):
        self.builder.variable('/test_var').values(['a', 'b'])
        self.builder.variable('/test_var').values(['a', 'b']).id('id-1')
        data = self.builder.get_data().to_object()

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'variables': {
                '/test_var': {
                    'variables': [
                        {
                            'values': {
                                'strings': ['a', 'b']
                            }
                        },
                        {
                            'base': {
                                'object_id': 'id-1'
                            },
                            'values': {
                                'strings': ['a', 'b']
                            }
                        }
                    ]
                }
            }
        }

        assert data == expected

    def test_bools_variable(self):
        self.builder.variable('/test_var').values([True, False])
        self.builder.variable('/test_var').values([True, False]).id('id-1')
        data = self.builder.get_data().to_object()

        expected = {
            'timestamp': 1.0,
            'poses': {
                PRIMARY_POSE_STREAM: DEFAULT_POSE
            },
            'variables': {
                '/test_var': {
                    'variables': [
                        {
                            'values': {
                                'bools': [True, False]
                            }
                        },
                        {
                            'base': {
                                'object_id': 'id-1'
                            },
                            'values': {
                                'bools': [True, False]
                            }
                        }
                    ]
                }
            }
        }

        assert data == expected

# No pose should not error
class TestOnlyPrimitiveBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = XVIZBuilder()

    def test_polyline(self):
        verts = [0., 0., 0., 4., 0., 0., 4., 3., 0.]
        self.builder.timestamp(1.0)
        self.builder.primitive('/test/polyline')\
            .polyline(verts)\
            .id('1')\
            .style({
                'stroke_color': [255, 0, 0]
            })

        expected = {
            'timestamp': 1.0,
            'primitives': {
                '/test/polyline': {
                    'polylines': [
                        {
                            'base': {
                                'style': {
                                    'stroke_color': [255, 0, 0],
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
