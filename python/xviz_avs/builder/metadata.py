import logging
from easydict import EasyDict as edict
import numpy as np

from xviz_avs.message import XVIZMessage
from xviz_avs.builder.base_builder import build_object_style, build_stream_style
from xviz_avs.v2.session_pb2 import Metadata, StreamMetadata, LogInfo, UIPanelInfo

class XVIZMetadataBuilder:
    def __init__(self, logger=logging.getLogger("xviz")):
        self._logger = logger

        self._data = Metadata(version="2.0.0")
        self._temp_ui_builder = None
        self._reset()

    def get_data(self):
        self._flush()
        
        metadata = self._data

        if self._temp_ui_builder:
            panels = self._temp_ui_builder.get_ui()
            metadata.ui_config = edict()

            for panel_key in panels.keys():
                metadata.ui_config[panel_key] = UIPanelInfo(
                    name=panels[panel_key].name,
                    config=panels[panel_key]
                )
        return metadata

    def get_message(self):
        return XVIZMessage(metadata=self.get_data())

    def start_time(self, time):
        self._data.log_info.start_time = time
        return self

    def end_time(self, time):
        self._data.log_info.end_time = time
        return self

    def ui(self, ui_builder):
        self._temp_ui_builder = ui_builder
        return self

    def stream(self, stream_id):
        if self._stream_id:
            self._flush()

        self._stream_id = stream_id
        return self

    def category(self, category):
        '''
        Assign category for the stream. Used for validation in XVIZBuilder and not required for data.
        '''
        if isinstance(category, int):
            self._temp_stream.category = category
        elif isinstance(category, str):
            self._temp_stream.category = StreamMetadata.Category.Value(category.upper())
        else:
            self._logger.error("Invalid value type for category!")
        return self

    def type(self, t):
        '''
        Assign primitive type for the stream. Used for validation in XVIZBuilder and not required for data.
        '''
        if isinstance(t, int):
            self._temp_type = t
        elif isinstance(t, str):
            self._temp_type = t.upper()
        else:
            self._logger.error("Invalid value type for category!")
        return self

    def source(self, source):
        self._temp_stream.source = source
        return self

    def unit(self, u):
        self._temp_stream.units = u
        return self

    def coordinate(self, coordinate):
        self._temp_stream.coordinate = coordinate
        return self

    def transform_matrix(self, matrix):
        matrix = np.array(matrix).ravel()
        self._temp_stream.transform.extend(matrix.tolist())
        return self

    def pose(self, position={}, orientation={}):
        raise NotImplementedError() # TODO: implement transformation

    def stream_style(self, style):
        self._temp_stream.stream_style.MergeFrom(build_stream_style(style))
        return self

    def style_class(self, name, style):
        if not self._stream_id:
            self._logger.error('A stream must set before adding a style rule.')
            return self

        stream_rule = edict(name=name, style=build_object_style(style))
        self._temp_stream.style_classes.append(stream_rule)
        return self

    def log_info(self, data):
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
