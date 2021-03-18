from xviz_avs.builder.declarative_ui import *

from functools import partial


class XVIZUIBuilder:
    """
    # Reference
    [@xviz/builder/xviz-base-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-base-builder.js)
    kwargs
    - validateError
    - validateWarn
    - logger
    """
    def __init__(self, **kwargs):
        self._kwargs = kwargs
        self._panels = []

        self._ui_types = {
            "panel": XVIZPanelBuilder,
            "container": XVIZContainerBuilder,
            "metric": XVIZMetricBuilder,
            "plot": XVIZPlotBuilder,
            "select": XVIZSelectBuilder,
            "table": XVIZTableBuilder,
            "treetable": XVIZTreeTableBuilder,
            "video": XVIZVideoBuilder
        }

    def child(self, panel):
        if not isinstance(panel, XVIZPanelBuilder):
            raise TypeError("Argument panel must be an XVIZPanelBuilder instance")
        self._panels.append(panel)

    def get_ui(self):
        ui = {item.name: item.get_ui() for item in self._panels}
        return ui

    def __getattr__(self, attrname):
        if attrname in self._ui_types:
            return partial(self._ui_types[attrname], **self._kwargs)
        else:
            raise NameError('"{0}" is not a supported UI component'.format(attrname))
