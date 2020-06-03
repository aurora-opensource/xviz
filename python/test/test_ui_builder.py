from xviz_avs.builder import XVIZUIBuilder
from xviz_avs.builder.declarative_ui import UI_TYPES

import unittest


class TestUIBuilder(unittest.TestCase):
    @unittest.skip("TODO")
    def test_validation(self):
        pass

    @unittest.skip("TODO")
    def test_logging(self):
        pass

    @unittest.skip("TODO")
    def test_complex_ui(self):
        pass

    def test_single_empty_panel_ui(self):
        b = XVIZUIBuilder()
        b.child(b.panel("test"))
        expected = {
            "test": {
                "name": "test",
                "type": UI_TYPES.PANEL
            }
        }

        assert b.get_ui() == expected

    def test_basic(self):
        b = XVIZUIBuilder()
        p1 = b.panel("test1")
        c1 = b.container('container')
        c1.child(b.metric(["/test1/m"]))
        p1.child(c1)

        p2 = b.panel("test2")
        p2.child(b.metric(["/test2/m", "/test2/m2"]))

        b.child(p1)
        b.child(p2)

        expected = {
            "test1": {
                "name": "test1",
                "type": UI_TYPES.PANEL,
                "children": [
                    {
                        "type": UI_TYPES.CONTAINER,
                        "name": "container",
                        "children": [
                            {
                                "type": UI_TYPES.METRIC,
                                "streams": ["/test1/m"]
                            }
                        ]
                    }
                ]
            },
            "test2": {
                "name": "test2",
                "type": UI_TYPES.PANEL,
                "children": [
                    {
                        "type": UI_TYPES.METRIC,
                        "streams": ["/test2/m", "/test2/m2"]
                    }
                ]
            }
        }

        assert b.get_ui() == expected

    def test_unknown_component(self):
        with self.assertRaises(NameError):
            b = XVIZUIBuilder()
            p1 = b.widget("test1")
