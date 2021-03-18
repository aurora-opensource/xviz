from xviz_avs.builder.declarative_ui.base_ui_builder import XVIZBaseUiBuilder


class XVIZBaseUiComponent(XVIZBaseUiBuilder):
    def __init__(self, type, title=None, description=None, **kwargs):
        super().__init__(type, **kwargs)
        self._title = title
        self._description = description

    def get_ui(self):
        obj = super().get_ui()

        if self._title:
            obj["title"] = self._title

        if self._description:
            obj["description"] = self._description

        return obj
