from typing import Union, Iterable, Dict

from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY, UIPRIMITIVE_TYPES
from xviz_avs.v2.core_pb2 import UIPrimitiveState
from xviz_avs.v2.uiprimitives_pb2 import TreeTableNode, TreeTableColumn


class XVIZTreeTableRowBuilder:
    def __init__(self, id_: int, values: Union[int, float, str, bool], parent: int = None):
        self._node = TreeTableNode(id=id_)
        if parent:
            self._node.parent = parent
        self._node.column_values.extend([str(v) for v in values])
        self._children = []

    def child(self, id_: str, values: Union[int, float, str, bool]) -> 'XVIZTreeTableRowBuilder':
        row = XVIZTreeTableRowBuilder(id_, values, self._node.id)
        self._children.append(row)
        return row

    def get_data(self) -> list:
        return [self._node] + [node for child in self._children for node in child.get_data()]


class XVIZUIPrimitiveBuilder(XVIZBaseBuilder):
    def __init__(self, metadata):
        super().__init__(CATEGORY.PRIMITIVE, metadata)

        self.reset()
        self._primitives = {}

    def reset(self):
        super().reset()
        self._type = None
        self._columns = None
        self._rows = []

    def treetable(self, columns: Iterable[dict]):
        if self._type:
            self._flush()

        self._validate_prop_set_once('_columns')

        self._columns = [TreeTableColumn(**col) for col in columns]
        self._type = UIPRIMITIVE_TYPES.TREETABLE

        return self

    def row(self, id_: int, values: Union[int, float, str, bool]) -> XVIZTreeTableRowBuilder:
        self._validate_prop_set_once('_id')

        row = XVIZTreeTableRowBuilder(id_, values)
        self._rows.append(row)
        self._type = UIPRIMITIVE_TYPES.TREETABLE

        return row

    def _flush(self):
        self._validate()
        self._flush_primitive()

    def get_data(self) -> Dict[str, UIPrimitiveState]:
        if self._type:
            self._flush()
        return self._primitives

    def _flush_primitive(self):
        if self._type == UIPRIMITIVE_TYPES.TREETABLE:
            if self._stream_id not in self._primitives:
                self._primitives[self._stream_id] = UIPrimitiveState()
                self._validate_has_prop('_columns')
                self._primitives[self._stream_id].treetable.columns.extend(self._columns)

            for row in self._rows:
                self._primitives[self._stream_id].treetable.nodes.extend(row.get_data())

        self.reset()
