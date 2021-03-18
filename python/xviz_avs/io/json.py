import json
from .base import XVIZBaseWriter

from xviz_avs.message import XVIZEnvelope, XVIZMessage, Metadata

class XVIZJsonWriter(XVIZBaseWriter):
    def __init__(self, sink, wrap_envelope=True, float_precision=10, as_array_buffer=False):
        super().__init__(sink)
        self._wrap_envelop = wrap_envelope
        self._json_precision = float_precision

    def write_message(self, message: XVIZMessage, index: int = None):
        self._check_valid()
        if self._wrap_envelop:
            obj = XVIZEnvelope(message).to_object()
        else:
            obj = message.to_object()

        fname = self._get_sequential_name(message, index) + '.json'

        # Encode GLB into file
        result = [] # These codes are for float truncation
        for part in json.JSONEncoder(separators=(',', ':')).iterencode(obj):
            try:
                rounded = round(float(part), self._json_precision)
            except ValueError:
                pass
            else: part = str(rounded)
            result.append(part)
        self._source.write(''.join(result).encode('ascii'), fname)
