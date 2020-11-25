import logging
from easydict import EasyDict as edict

from xviz_avs.message import XVIZFrame, XVIZMessage

from xviz_avs.builder.link import XVIZLinkBuilder
from xviz_avs.builder.future_instance import XVIZFutureInstanceBuilder
from xviz_avs.builder.pose import XVIZPoseBuilder
from xviz_avs.builder.primitive import XVIZPrimitiveBuilder
from xviz_avs.builder.variable import XVIZVariableBuilder
from xviz_avs.builder.ui_primitive import XVIZUIPrimitiveBuilder
from xviz_avs.builder.time_series import XVIZTimeSeriesBuilder

from xviz_avs.v2.core_pb2 import StreamSet
from xviz_avs.v2.session_pb2 import StateUpdate
from google.protobuf.json_format import MessageToDict

PRIMARY_POSE_STREAM = '/vehicle_pose'

class XVIZBuilder:
    def __init__(self, metadata=None, disable_streams=None,
                 logger=logging.getLogger("xviz"),
                 update_type=StateUpdate.UpdateType.INCREMENTAL):
        self._logger = logger
        self._metadata = metadata
        self._disable_streams = disable_streams or []
        self._stream_builder = None
        self._stream_buffers = {}
        self._update_type = update_type

        self._links_builder = XVIZLinkBuilder(self._metadata, self._logger)
        self._pose_builder = XVIZPoseBuilder(self._metadata, self._logger)
        self._variables_builder = XVIZVariableBuilder(self._metadata, self._logger)
        self._primitives_builder = XVIZPrimitiveBuilder(self._metadata, self._logger)
        self._future_instance_builder = XVIZFutureInstanceBuilder(self._metadata, self._logger)
        self._ui_primitives_builder = XVIZUIPrimitiveBuilder(self._metadata, self._logger)
        self._time_series_builder = XVIZTimeSeriesBuilder(self._metadata, self._logger)

    def pose(self, stream_id=PRIMARY_POSE_STREAM):
        self._stream_builder = self._pose_builder.stream(stream_id)
        return self._stream_builder

    def variable(self, stream_id):
        self._stream_builder = self._variables_builder.stream(stream_id)
        return self._stream_builder

    def primitive(self, stream_id):
        self._stream_builder = self._primitives_builder.stream(stream_id)
        return self._stream_builder

    def future_instance(self, stream_id, timestamp):
        self._stream_builder = self._future_instance_builder.stream(stream_id)
        self._stream_builder.timestamp(timestamp)
        return self._stream_builder

    def ui_primitives(self, stream_id):
        self._stream_builder = self._ui_primitives_builder.stream(stream_id)
        return self._stream_builder

    def time_series(self, stream_id):
        self._stream_builder = self._time_series_builder.stream(stream_id)
        return self._stream_builder

    def link(self, parent, child):
        self._stream_builder = self._links_builder.stream(child).parent(parent)
        return self._stream_builder

    def _reset(self):
        self._stream_builder = None

    def _get_streamset(self):
        poses = self._pose_builder.get_data()
        if (not poses) or (PRIMARY_POSE_STREAM not in poses):
            self._logger.error('Every message requires a %s stream', PRIMARY_POSE_STREAM)

        primitive_data, primitive_buffer = self._primitives_builder.get_data()
        futures_data, futures_buffer = self._future_instance_builder.get_data()
        sset = StreamSet(
            timestamp=poses[PRIMARY_POSE_STREAM].timestamp, # XXX: does timestamp have to be the same with pose?
            poses=poses,
            primitives=primitive_data,
            future_instances=futures_data,
            variables=self._variables_builder.get_data(),
            time_series=self._time_series_builder.get_data(),
            ui_primitives=self._ui_primitives_builder.get_data(),
            links=self._links_builder.get_data()
        )
        self._stream_buffers.update(primitive_buffer)
        self._stream_buffers.update(futures_buffer)
        return sset

    def get_data(self) -> XVIZFrame:
        return XVIZFrame(self._get_streamset(), self._stream_buffers)

    def get_message(self) -> XVIZMessage:
        message = XVIZMessage(StateUpdate(
            update_type=self._update_type,
            updates=[self._get_streamset()],
        ), buffers=[self._stream_buffers])
        return message
