from typing import Tuple
from collections import defaultdict

from xviz_avs.builder.base_builder import CATEGORY, PRIMITIVE_TYPES
from xviz_avs.builder.primitive import XVIZPrimitiveBuilder
from xviz_avs.v2.core_pb2 import FutureInstances, PrimitiveState


class XVIZFutureInstanceBuilder(XVIZPrimitiveBuilder):
    def __init__(self, metadata):
        super().__init__(metadata)
        self._category = CATEGORY.FUTURE_INSTANCE  # Override category

        self.reset()
        self._futures = {}
        self._futures_buffer = defaultdict(list)

        # Store entries in this list as (timestamp, type, primitive)
        # which we convert to Protobuf messages upon get_data()
        self._futures_list = defaultdict(list)

    def reset(self):
        super().reset()
        self._ts = None

    def timestamp(self, timestamp: float) -> 'XVIZFutureInstanceBuilder':
        self._ts = timestamp
        return self

    def _get_primitives_type(self, primitives, primitive_type):
        if primitive_type == PRIMITIVE_TYPES.CIRCLE:
            return primitives.circles
        elif primitive_type == PRIMITIVE_TYPES.IMAGE:
            return primitives.images
        elif primitive_type == PRIMITIVE_TYPES.POINT:
            return primitives.points
        elif primitive_type == PRIMITIVE_TYPES.POLYGON:
            return primitives.polygons
        elif primitive_type == PRIMITIVE_TYPES.POLYLINE:
            return primitives.polylines
        elif primitive_type == PRIMITIVE_TYPES.STADIUM:
            return primitives.stadiums
        elif primitive_type == PRIMITIVE_TYPES.TEXT:
            return primitives.texts
        else:
            self._logger.error("FutureInstance type '%s' is not recognized", str(primitive_type))
            return []

    def _flush_futures_list(self):
        # Since you cannot insert into a repeated message field
        # we construct the protobuf message in order
        for stream, entries in self._futures_list.items():
            if stream not in self._futures:
                self._futures[stream] = FutureInstances()

                futures = self._futures[stream]

                # sort on timestamp
                entries.sort(key=lambda e: e[0])
                last_ts = None

                for ets, etype, eprimitive, ebuffer in entries:
                    if last_ts is None or ets != last_ts:
                        # Adding a new timestamp entry to the arrays
                        last_ts = ets
                        futures.timestamps.append(ets)
                        future_prim = futures.primitives.add()

                    else:
                        index = len(futures.timestamps)-1
                        future_prim = futures.primitives[index]

                    future_prim_type = self._get_primitives_type(future_prim, etype)
                    future_prim_type.append(eprimitive)

                    if ebuffer is not None:
                        self._futures_buffer[(stream, ets)].append(ebuffer)


    def _flush(self):
        primitive = self._format_primitive(len(self._futures_list[self._stream_id]))

        self._futures_list[self._stream_id].append((self._ts, self._type, primitive, self._vertices_buffer))

        self.reset()

    def get_data(self) -> Tuple[FutureInstances, dict]:
        if self._type:
            self._flush()

        self._flush_futures_list()

        return self._futures, self._futures_buffer
