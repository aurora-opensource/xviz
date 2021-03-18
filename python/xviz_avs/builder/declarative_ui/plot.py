from xviz_avs.builder.declarative_ui.base_ui_component import XVIZBaseUiComponent
from xviz_avs.builder.declarative_ui.constants import UI_TYPES


class XVIZPlotBuilder(XVIZBaseUiComponent):
    def __init__(self, independentVariable, dependentVariables, regions=None, **kwargs):
        super().__init__(UI_TYPES.PLOT, **kwargs)
        self._independentVariable = independentVariable
        self._dependentVariables = dependentVariables
        self._regions = regions

        self._validate()

    def _validate(self):
        if self._independentVariable is not None:
            if self._dependentVariables is None:
                self._validateError('A Plot with an "independentVariable" must have a "dependentVariables"')
        elif self._regions is None:
            self._validateError('A Plot must be provided "regions" if it is using the "independentVariable"')

    def get_ui(self):
        obj = super().get_ui()

        if self._independentVariable:
            obj["independentVariable"] = self._independentVariable
            obj["dependentVariables"] = self._dependentVariables

        if self._regions:
            obj["regions"] = self._regions

        return obj
