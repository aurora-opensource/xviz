# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: xviz/v2/uiprimitives.proto
# Protobuf Python Version: 4.25.3
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from xviz_avs.v2 import options_pb2 as xviz_dot_v2_dot_options__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1axviz/v2/uiprimitives.proto\x12\x07xviz.v2\x1a\x15xviz/v2/options.proto\"z\n\tTreeTable\x12)\n\x07\x63olumns\x18\x01 \x03(\x0b\x32\x18.xviz.v2.TreeTableColumn\x12%\n\x05nodes\x18\x02 \x03(\x0b\x32\x16.xviz.v2.TreeTableNode:\x1b\xc2\xbb\x1a\x17ui-primitives/treetable\"\xd1\x01\n\x0fTreeTableColumn\x12\x14\n\x0c\x64isplay_text\x18\x01 \x01(\t\x12\x31\n\x04type\x18\x02 \x01(\x0e\x32#.xviz.v2.TreeTableColumn.ColumnType\x12\x0c\n\x04unit\x18\x03 \x01(\t\"g\n\nColumnType\x12)\n%TREE_TABLE_COLUMN_COLUMN_TYPE_INVALID\x10\x00\x12\t\n\x05INT32\x10\x01\x12\n\n\x06\x44OUBLE\x10\x02\x12\n\n\x06STRING\x10\x03\x12\x0b\n\x07\x42OOLEAN\x10\x04\"B\n\rTreeTableNode\x12\n\n\x02id\x18\x01 \x01(\x05\x12\x0e\n\x06parent\x18\x02 \x01(\x05\x12\x15\n\rcolumn_values\x18\x03 \x03(\tBC\n\x0b\x63om.xviz.v2B\x11UiprimitivesProtoP\x01Z\x04v2pb\xa2\x02\x04XVIZ\xaa\x02\x07xviz.V2\xca\x02\x07Xviz\\V2b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'xviz.v2.uiprimitives_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  _globals['DESCRIPTOR']._options = None
  _globals['DESCRIPTOR']._serialized_options = b'\n\013com.xviz.v2B\021UiprimitivesProtoP\001Z\004v2pb\242\002\004XVIZ\252\002\007xviz.V2\312\002\007Xviz\\V2'
  _globals['_TREETABLE']._options = None
  _globals['_TREETABLE']._serialized_options = b'\302\273\032\027ui-primitives/treetable'
  _globals['_TREETABLE']._serialized_start=62
  _globals['_TREETABLE']._serialized_end=184
  _globals['_TREETABLECOLUMN']._serialized_start=187
  _globals['_TREETABLECOLUMN']._serialized_end=396
  _globals['_TREETABLECOLUMN_COLUMNTYPE']._serialized_start=293
  _globals['_TREETABLECOLUMN_COLUMNTYPE']._serialized_end=396
  _globals['_TREETABLENODE']._serialized_start=398
  _globals['_TREETABLENODE']._serialized_end=464
# @@protoc_insertion_point(module_scope)
