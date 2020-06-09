from xviz_avs.builder.declarative_ui.base_ui_component import XVIZBaseUiComponent
from xviz_avs.builder.declarative_ui.constants import UI_TYPES


class XVIZSelectBuilder(XVIZBaseUiComponent):
    def __init__(self, stream, target, **kwargs):
        super().__init__(UI_TYPES.SELECT, **kwargs)
        self._stream = stream
        self._target = target

        self._validate()

    def _validate(self):
        if self._stream is None:
            self._validateError('A Select must have a "stream" associated')
        if self._target is None:
            self._validateError('A Select must have a "target" associated')

    def get_ui(self):
        obj = super().get_ui()
        obj["stream"] = self._stream
        obj["onchange"] = {"target": self._target}
        return obj
