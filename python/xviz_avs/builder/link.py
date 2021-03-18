from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY, PRIMITIVE_TYPES
from xviz_avs.v2.core_pb2 import Link

class XVIZLinkBuilder(XVIZBaseBuilder):
    def __init__(self, metadata, logger=None):
        super().__init__(None, metadata, logger)
        self._links = None
        self._target_stream = None

    def parent(self, target_stream):
        self._target_stream = target_stream

    def _flush(self):
        if not self._links:
            self._links = {}

        data = Link()
        if self._target_stream:
            data.target_pose = self._target_stream
            self._links[self._stream_id] = data

    def reset(self):
        super().reset()

    def get_data(self):
        if self._stream_id:
            self._flush()

        return self._links
