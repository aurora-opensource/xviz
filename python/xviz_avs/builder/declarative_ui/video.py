from xviz_avs.builder.declarative_ui.base_ui_builder import XVIZBaseUiBuilder
from xviz_avs.builder.declarative_ui.constants import UI_TYPES


class XVIZVideoBuilder(XVIZBaseUiBuilder):
    def __init__(self, cameras, **kwargs):
        super().__init__(UI_TYPES.VIDEO, **kwargs)
        self._cameras = cameras

        self._validate()

    def _validate(self):
        if self._cameras is None:
            self._validateError('A Video must have a stream associated')

    def get_ui(self):
        obj = super().get_ui()
        obj["cameras"] = self._cameras

        return obj
