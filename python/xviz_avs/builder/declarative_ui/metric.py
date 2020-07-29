from xviz_avs.builder.declarative_ui.base_ui_component import XVIZBaseUiComponent
from xviz_avs.builder.declarative_ui.constants import UI_TYPES


class XVIZMetricBuilder(XVIZBaseUiComponent):
    def __init__(self, streams, **kwargs):
        super().__init__(UI_TYPES.METRIC, **kwargs)
        self._streams = streams

        self._validate()

    def _validate(self):
        if self._streams is None or len(self._streams) == 0:
            self._validateError('A Metric must have a stream associated')

    def get_ui(self):
        obj = super().get_ui()
        obj["streams"] = self._streams

        return obj
