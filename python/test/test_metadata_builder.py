from xviz_avs.builder import XVIZMetadataBuilder
from xviz_avs.builder import XVIZUIBuilder
from xviz_avs.builder.declarative_ui import UI_TYPES
from google.protobuf.json_format import MessageToDict

import unittest


class TestMetadataBuilder(unittest.TestCase):

    def test_simple_ui(self):
        b = XVIZUIBuilder()
        b.child(b.panel("test"))

        m = XVIZMetadataBuilder()
        m.ui(b)

        expected = {
            "version": "2.0.0",
            "ui_config": {
                "test": {
                    "name": "test",
                    "config": {
                        "name": "test",
                        "type": UI_TYPES.PANEL
                    }
                }
            }
        }

        assert MessageToDict(m.get_data(), preserving_proto_field_name=True) == expected
