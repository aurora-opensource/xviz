from xviz_avs.builder.declarative_ui import *

import unittest


class TestPoseBuilder(unittest.TestCase):
    def test_metric_basic(self):
        container = XVIZMetricBuilder(['test'], description="test values", title="test metric")
        model = container.get_ui()
        expected = {
            "type": UI_TYPES.METRIC,
            "streams": ["test"],
            "description": "test values",
            "title": "test metric"
        }

        assert model == expected

    @unittest.skip("TODO")
    def test_containers_complex(self):
        pass

    def test_containers_basic(self):
        testCase = [
                {"type": UI_TYPES.CONTAINER,
                 "class": XVIZContainerBuilder},
                {"type": UI_TYPES.PANEL,
                 "class": XVIZPanelBuilder}
        ]

        metric = XVIZMetricBuilder(['test'], description="test values", title="test metric")

        for case in testCase:
            container = case["class"]('test', UI_LAYOUT.HORIZONTAL, UI_INTERACTIONS.DRAG_OUT)
            container.child(metric)

            model = container.get_ui()
            expected = {
                "type": case["type"],
                "name": "test",
                "layout": UI_LAYOUT.HORIZONTAL,
                "interactions": UI_INTERACTIONS.DRAG_OUT,
                "children": [
                    {
                    "type": UI_TYPES.METRIC,
                    "streams": ["test"],
                    "description": "test values",
                    "title": "test metric"}
                ]
            }

            assert model == expected

    def test_tables_basic(self):
        testCase = [
                {"type": UI_TYPES.TABLE,
                 "class": XVIZTableBuilder},
                {"type": UI_TYPES.TREETABLE,
                 "class": XVIZTreeTableBuilder}
        ]

        for case in testCase:
            container = case["class"]('test', description='table data', title='test table')

            model = container.get_ui()
            expected = {
                "type": case["type"],
                "stream": "test",
                "displayObjectId": False,
                "title": 'test table',
                "description": "table data"
            }

            assert model == expected

    def test_plot_basic(self):
        container = XVIZPlotBuilder('test_indep', ['test_dep'])
        model = container.get_ui()
        expected = {
            "type": UI_TYPES.PLOT,
            "independentVariable": "test_indep",
            "dependentVariables": ["test_dep"]
        }

        assert model == expected

    @unittest.skip("TODO")
    def test_plot_regions(self):
        pass

    def test_video_basic(self):
        container = XVIZVideoBuilder(['test'])
        model = container.get_ui()
        expected = {
            "type": UI_TYPES.VIDEO,
            "cameras": ["test"]
        }

        assert model == expected

    def test_select_basic(self):
        container = XVIZSelectBuilder('test', "target stream")
        model = container.get_ui()
        expected = {
            "type": UI_TYPES.SELECT,
            "stream": 'test',
            "onchange": {"target": "target stream"}
        }

        assert model == expected
