import json
from .base import XVIZBaseWriter

from xviz.message import XVIZEnvelope, XVIZMessage, Metadata

class XVIZProtobufWriter(XVIZBaseWriter):
    def __init__(self, sink, wrap_envelope=True, float_precision=10, as_array_buffer=False):
        super().__init__(sink)
        self._wrap_envelop = wrap_envelope
        self._json_precision = float_precision
        self._counter = 2

    def write_message(self, message: XVIZMessage, index: int = None):
        self._check_valid()
        if self._wrap_envelop:
            obj = XVIZEnvelope(message).data
        else:
            obj = message.data

        
        fname = self._get_sequential_name(message, index) + '.pbe'
        self._source.write(obj.SerializeToString(), fname)
