from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY, UIPRIMITIVE_TYPES
from xviz_avs.v2.core_pb2 import UIPrimitiveState
from xviz_avs.v2.uiprimitives_pb2 import TreeTableNode, TreeTable, TreeTableColumn

class XVIZTreeTableRowBuilder:
    def __init__(self, id_, values, parent=None):
        self._node = TreeTableNode(id=id_)
        if parent:
            self._node.parent = parent
        self._node.column_values.extend(values)
        self._children = []

    def children(self, id_, values):
        row = XVIZTreeTableRowBuilder(id_, values, self._node.id)
        self._children.append(row)

    def get_data(self):
        return [self._node] + [node for node in child.get_data() for child in self._children]

class XVIZUIPrimitiveBuilder(XVIZBaseBuilder):
    def __init__(self, metadata, logger=None):
        super().__init__(CATEGORY.PRIMITIVE, metadata, logger)

        self.reset()
        self._primitives = {}

    def reset(self):
        self._type = None
        self._colums = None
        self._rows = None

    def treetable(self, columns):
        if self._type:
            self._flush()

        self._validate_prop_set_once('_columns')

        self._columns = [TreeTableColumn(**col) for col in columns]
        self._type = UIPRIMITIVE_TYPES.TREETABLE

        return self

    def row(self, id_, values):
        if self._type:
            self._flush()

        self._row = XVIZTreeTableRowBuilder(id_, values)
        self._type = UIPRIMITIVE_TYPES.TREETABLE

    def _flush(self):
        self._validate()
        self._flush_primitive()

    def get_data(self):
        if self._type:
            self._flush()

        if self._primitives:
            return self._primitives

        return None

    def _flush_primitive(self):
        if self._type == UIPRIMITIVE_TYPES.TREETABLE:

            if self._stream_id not in self._primitives:
                self._primitives[self._stream_id] = UIPrimitiveState()

            self._validate_has_prop('_columns')
            self._primitives[self._stream_id].treetable.columns.extend(self._columns)
            if self._rows:
                self._primitives[self._stream_id].treetable.nodes.extend(self._rows.get_data())
