import logging
from typing import Union

import numpy as np
from easydict import EasyDict as edict
from xviz_avs.builder.base_builder import (CATEGORY, CATEGORY_T,
                                           COORDINATE_TYPES,
                                           COORDINATE_TYPES_T, SCALAR_TYPE,
                                           SCALAR_TYPE_T, build_object_style,
                                           build_stream_style)
from xviz_avs.builder.ui_builder import XVIZUIBuilder
from xviz_avs.message import XVIZMessage
from xviz_avs.v2.session_pb2 import LogInfo, Metadata, StreamMetadata


class XVIZMetadataBuilder:
    """
    # Reference
    [@xviz/builder/xviz-metadata-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-metadata-builder.js)
    """
    def __init__(self):
        self._logger = logging.getLogger("xviz")
        self._data = Metadata(version="2.0.0")
        self._temp_ui_builder = None
        self._reset()

    def get_data(self) -> Metadata:
        self._flush()

        metadata = self._data

        if self._temp_ui_builder:
            panels = self._temp_ui_builder.get_ui()

            for panel_key in panels.keys():
                metadata.ui_config[panel_key].name = panel_key
                metadata.ui_config[panel_key].config.update(panels[panel_key])

        return metadata

    def get_message(self) -> XVIZMessage:
        return XVIZMessage(metadata=self.get_data())

    def start_time(self, time: float) -> 'XVIZMetadataBuilder':
        self._data.log_info.start_time = time
        return self

    def end_time(self, time: float) -> 'XVIZMetadataBuilder':
        self._data.log_info.end_time = time
        return self

    def ui(self, ui_builder: XVIZUIBuilder) -> 'XVIZMetadataBuilder':
        self._temp_ui_builder = ui_builder
        return self

    def stream(self, stream_id: str) -> 'XVIZMetadataBuilder':
        if self._stream_id:
            self._flush()

        self._stream_id = stream_id
        return self

    def category(self, category: Union[CATEGORY_T, str]):
        '''
        Assign category for the stream. Used for validation in XVIZBuilder and not required for data.
        '''
        if isinstance(category, int):
            self._temp_stream.category = category
        elif isinstance(category, str):
            self._temp_stream.category = CATEGORY.Value(category.upper())
        else:
            self._logger.error("Invalid value type for category!")
        return self

    def type(self, t: Union[SCALAR_TYPE_T, str]):
        '''
        Assign primitive type for the stream. Used for validation in XVIZBuilder and not required for data.
        '''
        if isinstance(t, int):
            self._temp_type = t
        elif isinstance(t, str):
            self._temp_type = SCALAR_TYPE.Value(t.upper())
        else:
            self._logger.error("Invalid value type for category!")
        return self

    def source(self, source: str):
        self._temp_stream.source = source
        return self

    def unit(self, u: str):
        self._temp_stream.units = u
        return self

    def coordinate(self, coordinate: COORDINATE_TYPES_T):
        self._temp_stream.coordinate = coordinate
        return self

    def transform_matrix(self, matrix: Union[list, np.ndarray]):
        matrix = np.array(matrix).ravel()
        self._temp_stream.transform.extend(matrix.tolist())
        return self

    def pose(self, position={}, orientation={}):
        raise NotImplementedError() # TODO: implement transformation

    def stream_style(self, style: dict):
        self._temp_stream.stream_style.MergeFrom(build_stream_style(style))
        return self

    def style_class(self, name: str, style: dict):
        if not self._stream_id:
            self._logger.error('A stream must set before adding a style rule.')
            return self
        style_class = self._temp_stream.style_classes.add()
        style_class.name = name
        style_class.style.MergeFrom(build_object_style(style))
        return self

    def log_info(self, data: dict):
        self._data.log_info.MergeFrom(LogInfo(**data))
        return self

    def _flush(self):
        if self._stream_id:
            stream_data = self._temp_stream

            if stream_data.category in [1, 5]:
                stream_data.primitive_type = self._temp_type
            elif stream_data.category in [2, 3]:
                stream_data.scalar_type = self._temp_type

            self._data.streams[self._stream_id].MergeFrom(stream_data)

        self._reset()

    def _reset(self):
        self._stream_id = None
        self._temp_stream = StreamMetadata()
        self._temp_type = None
