from xviz_avs.builder.base_builder import CATEGORY, PRIMITIVE_TYPES
from xviz_avs.builder.primitive import XVIZPrimitiveBuilder
from xviz_avs.v2.core_pb2 import FutureInstances, PrimitiveState

class XVIZFutureInstanceBuilder(XVIZPrimitiveBuilder):
    def __init__(self, metadata, logger=None):
        super().__init__(metadata, logger)
        self._category = CATEGORY.FUTURE_INSTANCE # Override category

        self.reset()
        self._futures = {}

    def reset(self):
        super().reset()
        self._ts = None

    def timestamp(self, timestamp):
        self._ts = timestamp
        return self

    def flush(self):
        future = self._futures.get()
        if self._stream_id not in self._futures:
            self._futures[self._stream_id] = FutureInstances()

        primitive = self._format_pritimive()
        name = PRIMITIVE_TYPES.Name(self._type).lower() + 's'

        # Find number that equals the timestamp
        found = False
        min_idx = -1
        for idx, ts in enumerate(self._futures[self._stream_id].timestamps):
            if abs(self._ts - ts) < 1e-6:
                primitives = self._futures[self._stream_id].values[idx]
                if name not in primitives:
                    primitives[name] = []
                primitives[name].append(primitive)

                found = True
                break

            if min_idx < 0 and ts > self._ts:
                min_idx = idx

        if not found:
            # Insert new entry
            if min_idx == -1:
                min_idx = len(self._futures[self._stream_id].timestamps)

            self._futures[self._stream_id].timestamps[min_idx:min_idx] = [self._ts]
            self._futures[self._stream_id].values[min_idx:min_idx] = [{name: primitive}]

    def get_data(self):
        if self._type:
            self._flush()

        if not self._futures:
            return None
        return self._futures
