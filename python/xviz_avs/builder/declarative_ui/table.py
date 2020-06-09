from xviz_avs.builder.declarative_ui.base_ui_component import XVIZBaseUiComponent
from xviz_avs.builder.declarative_ui.constants import UI_TYPES


class XVIZTableBuilder(XVIZBaseUiComponent):
    def __init__(self, stream, displayObjectId=False, **kwargs):
        super().__init__(UI_TYPES.TABLE, **kwargs)
        self._stream = stream
        self._displayObjectId = displayObjectId

        self._validate()

    def _validate(self):
        if self._stream is None:
            self._validateError('A Table must have a stream associated')

    def get_ui(self):
        obj = super().get_ui()
        obj["stream"] = self._stream
        obj["displayObjectId"] = self._displayObjectId

        return obj
