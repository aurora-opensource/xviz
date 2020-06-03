import logging


class XVIZBaseUiBuilder:
    """
    # Reference
    [@xviz/builder/xviz-base-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-base-builder.js)
    """
    def __init__(self, type, validateError=None, validateWarn=None, logger=None):
        # TODO: validate* should be options, how does this sync iwht loggert
        # question is where do pythonic changes override conformance with JS
        self._type = type
        self._validateError = validateError
        self._validateWarn = validateWarn
        self._logger = logger or logging.getLogger("xviz")

    def _validate(self):
        pass

    def get_ui(self):
        obj = {"type": self._type}
        return obj
